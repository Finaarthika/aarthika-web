import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './passbook.css';

export default function SearchGrid() {
  const [view, setView] = useState('SEARCH'); // 'SEARCH' | 'LEDGER' | 'CREATE'
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Biometrics State
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState('');
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Ledger state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [netBalance, setNetBalance] = useState('0.00');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  
  // Transaction state
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionMsg, setTransactionMsg] = useState({ type: '', text: '' });

  // Create state
  const [newCustomer, setNewCustomer] = useState({
    customerName: '', fathersName: '', village: '', phone: '', aadharId: ''
  });
  const [capturedVector, setCapturedVector] = useState('');
  const [capturedImageBase64, setCapturedImageBase64] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // --- Biometrics Temporarily Disabled ---

  // --- CLEANUP CAMERA ---
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    // Stop camera when view changes away from CREATE or if doing Search Scan modal
    if (view === 'LEDGER') {
      stopCamera();
    }
  }, [view]);

  // --- API LOGIC ---
  useEffect(() => {
    if (view === 'SEARCH') {
      fetchCustomers('');
    }
  }, [view]);

  const fetchCustomers = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/passbook-search?search=${encodeURIComponent(query)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setCustomers(body.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const openLedger = async (customer) => {
    stopCamera();
    setSelectedCustomer(customer);
    setView('LEDGER');
    setTransactionMsg({ type: '', text: '' });
    await fetchLedger(customer.accountNumber);
  };

  const fetchLedger = async (accountNumber) => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/passbook-ledger?accountNumber=${encodeURIComponent(accountNumber)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setLedger(body.data || []);
      setNetBalance(body.currentNetBalance || '0.00');
    } catch (err) {
      setTransactionMsg({ type: 'error', text: `Failed to load ledger: ${err.message}` });
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleTransaction = async (type) => {
    const amount = type === 'DEPOSIT' ? depositAmount : withdrawAmount;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setTransactionMsg({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    setTransactionLoading(true);
    setTransactionMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/passbook-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: selectedCustomer.accountNumber,
          type: type,
          amount: amount
        })
      });
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      setTransactionMsg({ type: 'success', text: `SUCCESS: ${type} of ₹${amount} completed. New Balance: ${body.newBalance}` });
      if (type === 'DEPOSIT') setDepositAmount('');
      if (type === 'WITHDRAWAL') setWithdrawAmount('');
      
      await fetchLedger(selectedCustomer.accountNumber);
    } catch (err) {
      setTransactionMsg({ type: 'error', text: `ERROR: ${err.message}` });
    } finally {
      setTransactionLoading(false);
    }
  };

  // --- BIOMETRIC SEARCH TEMPORARILY DISABLED ---
  const handleFaceScanSearch = async () => {
    alert("Face scan search is temporarily disabled. Please use manual search.");
  };

  // --- ACCOUNT CREATION ---
  const startCreationCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Camera access required for secure account opening.");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    setBiometricStatus("CAPTURING PHOTO...");
    try {
      // Extract image base64 for PDF
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedImageBase64(canvas.toDataURL('image/jpeg', 0.8));
      
      setBiometricStatus("PHOTO LOCKED. READY TO SUBMIT.");
      
    } catch (err) {
      console.error(err);
      setBiometricStatus(`ERROR CAPTURING PHOTO: ${err.message}`);
    }
  };

  const submitNewAccount = async () => {
    if (!newCustomer.customerName || !newCustomer.phone) return alert("Name and Phone are required.");
    if (!capturedImageBase64) return alert("You must capture a photo first.");

    setCreateLoading(true);
    try {
      const res = await fetch('/api/passbook-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          faceVector: '' // Blank vector since biometrics are disabled
        })
      });
      const body = await res.json();
      
      if (!res.ok) throw new Error(body.error || "Failed to create account");

      // Generate PDF
      const pdfElement = document.getElementById('pdf-template');
      // Inject new Account Number into DOM for PDF
      document.getElementById('pdf-acc-no').innerText = body.accountNumber;
      
      html2pdf().from(pdfElement).set({
        margin: 0.5,
        filename: `Aarthika_Account_${body.accountNumber}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).save();

      alert(`Account Created Successfully: ${body.accountNumber}. PDF downloading...`);
      
      // Cleanup
      stopCamera();
      setNewCustomer({ customerName: '', fathersName: '', village: '', phone: '', aadharId: '' });
      setCapturedVector('');
      setCapturedImageBase64('');
      setView('SEARCH');

    } catch (err) {
      alert("Error creating account: " + err.message);
    } finally {
      setCreateLoading(false);
    }
  };


  // --- RENDER SCREEN 1: SEARCH ---
  if (view === 'SEARCH') {
    return (
      <div className="passbook-container">
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => { setView('CREATE'); startCreationCamera(); }} className="terminal-btn">
            [ 📝 OPEN NEW ACCOUNT ]
          </button>
        </div>

        <div className="terminal-divider">
          [================================================================================]<br/>
          {'  '}SEARCH BAR: [ <input 
            className="terminal-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            placeholder="Enter Name..."
          /> ] [ <button onClick={handleSearch} className="terminal-btn">🔍</button> ]
          <br/>
          [================================================================================]
        </div>

        {biometricStatus && <div className="success-text" style={{margin: '1rem 0'}}>{biometricStatus}</div>}
        {error && <div className="error-text">CONNECTION ERROR: {error}</div>}
        {loading && <div>SCANNING DATABASE...</div>}

        {!loading && !error && (
          <div style={{ marginTop: '2rem' }}>
            <div className="terminal-divider">+------------------------+-----------------+-----------------+-----------------+---------------+-------------+</div>
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>| Profile Image</th>
                  <th>| Customer Name</th>
                  <th>| Father's Name</th>
                  <th>| Village/Address</th>
                  <th>| Contact Number</th>
                  <th>| Action      |</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="terminal-divider" style={{margin: 0}}>+------------------------+-----------------+-----------------+-----------------+---------------+-------------+</td>
                </tr>
                {customers.map((c, i) => (
                  <React.Fragment key={c.accountNumber || i}>
                    <tr>
                      <td>| {c.photoLink ? <a href={c.photoLink} target="_blank" rel="noreferrer" className="terminal-btn">📷 IMAGE</a> : '[ NO IMG ]'}</td>
                      <td>| {c.customerName || '-'}</td>
                      <td>| {c.fathersName || '-'}</td>
                      <td>| {c.village || '-'}</td>
                      <td>| {c.phone || '-'}</td>
                      <td>| <button onClick={() => openLedger(c)} className="terminal-btn">[VIEW U]</button> |</td>
                    </tr>
                    <tr>
                      <td colSpan="6" className="terminal-divider" style={{margin: 0}}>+------------------------+-----------------+-----------------+-----------------+---------------+-------------+</td>
                    </tr>
                  </React.Fragment>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>| NO CUSTOMER RECORDS MATCHING QUERY |</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER SCREEN: CREATE ACCOUNT ---
  if (view === 'CREATE') {
    return (
      <div className="passbook-container">
        <div>
          <button onClick={() => { stopCamera(); setView('SEARCH'); }} className="terminal-btn">
            [ ⬅ Cancel & Back to Search ]
          </button>
        </div>

        <div className="terminal-divider">
          ================================================================================<br/>
          {'                          '}SECURE ACCOUNT ORIGINATION TERMINAL<br/>
          ================================================================================
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div className="terminal-box">
            <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ APPLICANT DETAILS ]</div>
            
            <div style={{marginBottom: '0.5rem'}}>Full Name (Req): <input className="terminal-input" value={newCustomer.customerName} onChange={e=>setNewCustomer({...newCustomer, customerName: e.target.value})} /></div>
            <div style={{marginBottom: '0.5rem'}}>Father's Name: <input className="terminal-input" value={newCustomer.fathersName} onChange={e=>setNewCustomer({...newCustomer, fathersName: e.target.value})} /></div>
            <div style={{marginBottom: '0.5rem'}}>Village: <input className="terminal-input" value={newCustomer.village} onChange={e=>setNewCustomer({...newCustomer, village: e.target.value})} /></div>
            <div style={{marginBottom: '0.5rem'}}>Contact No (Req): <input className="terminal-input" value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer, phone: e.target.value})} /></div>
            <div style={{marginBottom: '0.5rem'}}>Aadhar/Voter ID: <input className="terminal-input" value={newCustomer.aadharId} onChange={e=>setNewCustomer({...newCustomer, aadharId: e.target.value})} /></div>
          </div>

          <div className="terminal-box">
            <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ BIOMETRIC SCAN ]</div>
            <div style={{ border: '2px solid #111', width: '320px', height: '240px', marginBottom: '1rem', backgroundColor: '#e2e8f0', position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <button className="terminal-btn" onClick={capturePhoto}>
              [ 📸 CAPTURE PHOTO ]
            </button>
            
            <div className="success-text" style={{ marginTop: '1rem' }}>{biometricStatus}</div>
            {capturedVector && <div style={{ fontSize: '0.7rem', wordBreak: 'break-all', marginTop: '0.5rem' }}>Vector: {capturedVector.substring(0, 40)}...</div>}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="terminal-btn" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }} onClick={submitNewAccount} disabled={createLoading}>
            {createLoading ? '[ POSTING TO SECURE LEDGER... ]' : '[ 📝 SUBMIT APPLICATION & PRINT PASSBOOK ]'}
          </button>
        </div>

        {/* --- HIDDEN PDF TEMPLATE --- */}
        <div style={{ display: 'none' }}>
          <div id="pdf-template" style={{ padding: '40px', fontFamily: 'sans-serif', color: '#000', backgroundColor: '#fff', width: '800px' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px' }}>Aarthika Finance</h1>
                <h3 style={{ margin: '5px 0 0 0', color: '#555' }}>Rural Branch Operations</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0 }}>ACCOUNT PASSBOOK</h2>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }} id="pdf-acc-no">PENDING</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
                  <tbody>
                    <tr><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc', width: '40%', fontWeight: 'bold' }}>Account Holder:</td><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc' }}>{newCustomer.customerName}</td></tr>
                    <tr><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>Father's Name:</td><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc' }}>{newCustomer.fathersName}</td></tr>
                    <tr><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>Village/Address:</td><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc' }}>{newCustomer.village}</td></tr>
                    <tr><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>Contact Number:</td><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc' }}>{newCustomer.phone}</td></tr>
                    <tr><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>Gov ID (Aadhar):</td><td style={{ padding: '15px 0', borderBottom: '1px solid #ccc' }}>{newCustomer.aadharId}</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div style={{ width: '200px' }}>
                <div style={{ border: '2px solid #000', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                  {capturedImageBase64 ? (
                    <img src={capturedImageBase64} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : 'No Photo'}
                </div>
                <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>OFFICIAL BRANCH RECORD</div>
              </div>
            </div>

            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #000', fontSize: '12px', color: '#666', textAlign: 'center' }}>
              This document serves as the official opening record for the above-listed account.<br/>
              Aarthika Financial Services operates under strict rural compliance guidelines.<br/>
              Account photograph and details secured on {new Date().toLocaleString()}.<br/>
              By submitting this form, the applicant agrees to all terms and conditions of Aarthika Finance.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER SCREEN 2: LEDGER ---
  return (
    <div className="passbook-container">
      <div>
        <button onClick={() => setView('SEARCH')} className="terminal-btn">
          [ ⬅ Back to Customer Search List ]
        </button>
      </div>

      <div className="terminal-divider">
        ================================================================================<br/>
        {'                               '}CUSTOMER ACCOUNT PROFILE<br/>
        ================================================================================
      </div>

      <div className="ledger-details-grid">
        <div>
          {selectedCustomer?.photoLink ? (
            <img 
              src={selectedCustomer.photoLink} 
              alt="Profile" 
              style={{ width: '120px', height: '120px', objectFit: 'cover', border: '2px solid #111' }} 
            />
          ) : (
            <div style={{ width: '120px', height: '120px', border: '2px dashed #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              [ SECURE VECTOR ]
            </div>
          )}
        </div>
        <div>
          <table style={{ textAlign: 'left', borderSpacing: '0 8px' }}>
            <tbody>
              <tr><td style={{paddingRight: '20px'}}>Account Number:</td><td><strong>{selectedCustomer?.accountNumber}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Full Name:</td><td><strong>{selectedCustomer?.customerName}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Father's Name:</td><td><strong>{selectedCustomer?.fathersName}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Village/Area:</td><td><strong>{selectedCustomer?.village}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Phone Number:</td><td><strong>{selectedCustomer?.phone}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Gov ID:</td><td><strong>{selectedCustomer?.aadharId}</strong></td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Current Net Balance:</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{netBalance}</div>
        </div>
      </div>

      <div className="terminal-divider">
        ================================================================================
      </div>

      <div className="action-forms-grid">
        <div className="terminal-box">
          <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ 📥 DEPOSIT CASH ]</div>
          <div style={{ marginBottom: '1rem' }}>
            Amount (₹): [ <input 
              type="number" 
              className="terminal-input" 
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Enter Amount" 
            /> ]
          </div>
          <button 
            className="terminal-btn" 
            onClick={() => handleTransaction('DEPOSIT')}
            disabled={transactionLoading}
          >
            [ {transactionLoading ? 'PROCESSING...' : 'EXECUTE DEPOSIT'} ]
          </button>
        </div>

        <div className="terminal-box">
          <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ 📤 WITHDRAW CASH ]</div>
          <div style={{ marginBottom: '1rem' }}>
            Amount (₹): [ <input 
              type="number" 
              className="terminal-input" 
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Enter Amount" 
            /> ]
          </div>
          <button 
            className="terminal-btn" 
            onClick={() => handleTransaction('WITHDRAWAL')}
            disabled={transactionLoading}
          >
            [ {transactionLoading ? 'PROCESSING...' : 'EXECUTE WITHDRAWAL'} ]
          </button>
        </div>
      </div>

      {transactionMsg.text && (
        <div className={transactionMsg.type === 'error' ? 'error-text' : 'success-text'} style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {transactionMsg.text}
        </div>
      )}

      <div className="terminal-divider">
        {'                              '}COMPLETE TRANSACTION PASSBOOK HISTORY<br/>
        ================================================================================
      </div>

      {ledgerLoading ? (
        <div>LOADING LEDGER RECORDS...</div>
      ) : (
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>| Transaction Type</th>
              <th>| Amount (INR)</th>
              <th>| Running Balance</th>
              <th>| Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="terminal-divider" style={{margin: 0}}>--------------------------------------------------------------------------------</td>
            </tr>
            {ledger.map((row) => (
              <React.Fragment key={row.id}>
                <tr>
                  <td>{row.timestamp}</td>
                  <td>| {row.type}</td>
                  <td>| {row.amount}</td>
                  <td>| {row.runningBalance}</td>
                  <td>| {row.status}</td>
                </tr>
              </React.Fragment>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>| NO TRANSACTIONS FOUND |</td>
              </tr>
            )}
            <tr>
              <td colSpan="5" className="terminal-divider" style={{margin: 0}}>================================================================================</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
