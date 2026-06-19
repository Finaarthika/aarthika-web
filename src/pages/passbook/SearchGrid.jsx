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
  const handleNativeCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBiometricStatus("PROCESSING IMAGE...");
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImageBase64(event.target.result);
      setBiometricStatus("PHOTO LOCKED. READY TO SUBMIT.");
    };
    reader.readAsDataURL(file);
  };

  const submitNewAccount = async () => {
    if (!newCustomer.customerName || !newCustomer.phone) return alert("Name and Phone are required.");
    if (!capturedImageBase64) return alert("You must capture a photo first.");

    setCreateLoading(true);
    try {
      // 1. Generate base64 PDF to send to the secure vault
      const pdfElement = document.getElementById('pdf-template');
      const pdfBase64DataUri = await html2pdf().from(pdfElement).set({
        margin: [10, 10, 10, 10],
        filename: `Aarthika_Account.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).output('datauristring');
      
      const pdfBase64 = pdfBase64DataUri.split(',')[1];

      // 2. Transmit to backend
      const res = await fetch('/api/passbook-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustomer.customerName,
          fathersName: newCustomer.fathersName,
          village: newCustomer.village,
          phone: newCustomer.phone,
          faceVector: '', 
          aadharId: newCustomer.aadharId,
          pdfBase64: pdfBase64
        })
      });
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      alert(`Account Created Successfully: ${body.accountNumber}. Opening PDF Receipt...`);
      
      // 3. Print the final local copy with the actual account number
      document.getElementById('pdf-acc-no').innerText = body.accountNumber;
      
      html2pdf().from(pdfElement).set({
        margin: [10, 10, 10, 10],
        filename: `Aarthika_Account_${body.accountNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).output('bloburl').then(function(pdfUrl) {
        window.open(pdfUrl, '_blank');
      });

      // Cleanup
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
          <button onClick={() => setView('CREATE')} className="terminal-btn">
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
          <button onClick={() => setView('SEARCH')} className="terminal-btn">
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
            <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ OFFICIAL PHOTOGRAPH ]</div>
            <div style={{ border: '2px dashed #111', width: '320px', height: '240px', marginBottom: '1rem', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {capturedImageBase64 ? (
                <img src={capturedImageBase64} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#555' }}>[ NO PHOTO ]</span>
              )}
            </div>
            
            <label className="terminal-btn" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px' }}>
              [ 📸 OPEN NATIVE CAMERA ]
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                style={{ display: 'none' }} 
                onChange={handleNativeCameraCapture} 
              />
            </label>
            
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
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="pdf-template" style={{ padding: '8px', fontFamily: '"Courier New", Courier, monospace', color: '#111', backgroundColor: '#fff', width: '277mm', boxSizing: 'border-box' }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111', paddingBottom: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/assets/Aarthika_logo.png" alt="Logo" style={{ height: '40px' }} />
                <div>
                  <h1 style={{ margin: 0, fontSize: '18px', letterSpacing: '0.5px' }}>AARTHIKA FINANCE • RURAL BRANCH OPERATIONS & MICROFINANCE</h1>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 'bold' }}>OFFICIAL ACCOUNT ORIGINATION RECORD</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', padding: '4px 8px', border: '1px solid #111', fontWeight: 'bold', fontSize: '14px' }} id="pdf-acc-no">PENDING</div>
              </div>
            </div>

            {/* Applicant Details & Photo */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', width: '30%', fontWeight: 'bold' }}>Full Name:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold', fontSize: '14px' }}>{newCustomer.customerName}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Father's Name:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>{newCustomer.fathersName}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Residential Village:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>{newCustomer.village}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Contact Mobile:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>+91 {newCustomer.phone}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Gov. ID (Aadhar/Voter):</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>{newCustomer.aadharId || 'NOT PROVIDED'}</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <div style={{ border: '2px solid #00ff41', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                  {capturedImageBase64 ? (
                    <img src={capturedImageBase64} alt="Captured" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                  ) : <span style={{fontSize: '10px', color: '#94a3b8'}}>No Photo</span>}
                </div>
                <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>BIOMETRIC VERIFICATION SECURED</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #111', marginBottom: '8px' }}></div>

            {/* Formal Terms & Conditions */}
            <div style={{ fontSize: '10px', color: '#111', lineHeight: '1.3', textAlign: 'justify' }}>
              <div style={{ marginBottom: '4px' }}><strong>1. ACCOUNT VALIDITY & SECURED OPERATION:</strong> This document serves as the official registration record for account origination under Aarthika Finance Rural Branch Operations. All active ledgers are backed exclusively by deposited asset values or evaluated gold/silver collateral vectors held under branch custody.</div>
              <div style={{ marginBottom: '4px' }}><strong>2. TRANSACTIONS & PASSBOOK ACCOUNTABILITY:</strong> Deposits and withdrawals must be authenticated in person at the portal terminal via direct text lookup or matching face biometric verification metrics. Every transaction will generate an immediate running balance update logged directly into the immutable centralized master ledger sheet.</div>
              <div style={{ marginBottom: '4px' }}><strong>3. OVERDRAFT SHIELDING & LIQUIDATION BOUNDARIES:</strong> The ledger system enforces strict zero-overdraft boundaries. Withdrawal requests exceeding the current net balance will be automatically restricted and denied by the server terminal routing system.</div>
              <div><strong>4. AUDIT & ASSET CUSTODY RIGOR:</strong> Aarthika Finance retains absolute authority to freeze, audit, or review ledger operations if irregular transaction histories or unauthorized profile anomalies are captured. Collateral liquidations follow regulatory micro-lending guidelines.</div>
            </div>

            <div style={{ borderTop: '1px solid #111', marginTop: '10px', marginBottom: '20px' }}></div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #111', width: '200px', height: '20px' }}></div>
                <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 'bold' }}>Applicant Signature / Thumbprint</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #111', width: '200px', height: '20px' }}></div>
                <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 'bold' }}>Branch Manager Authorization</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '9px', color: '#555' }}>
              Generated Timestamp: {new Date().toLocaleString()} | Aarthika Financial Services - Secure Ledger System
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
