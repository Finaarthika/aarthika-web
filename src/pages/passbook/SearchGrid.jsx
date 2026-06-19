import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

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
      const pdfBase64Str = await html2pdf().from(pdfElement).set({
        margin: [10, 10, 10, 10],
        filename: `Aarthika_Account.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).toPdf().output('datauristring');
      
      const cleanBase64 = pdfBase64Str.split(',')[1];

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
          pdfFile: cleanBase64
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
      <div className="bg-gray-50 min-h-screen py-10 font-sans">
        <div className="premium-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Passbook Portal</h1>
            <button onClick={() => setView('CREATE')} className="btn btn-primary flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Open New Account
            </button>
          </div>

          <div className="premium-card p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input 
                className="input-premium w-full text-lg shadow-sm" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by customer name or phone..."
              />
            </div>
            <button onClick={handleSearch} className="btn btn-primary px-8 py-3 flex items-center justify-center gap-2 w-full sm:w-auto text-lg shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search
            </button>
          </div>

          {biometricStatus && <div className="text-green-600 font-medium mb-4 bg-green-50 p-3 rounded-lg border border-green-100">{biometricStatus}</div>}
          {error && <div className="text-red-600 font-medium mb-4 p-4 bg-red-50 rounded-lg border border-red-100">{error}</div>}
          {loading && <div className="text-gray-500 font-medium flex items-center gap-3 p-4"><svg className="animate-spin h-6 w-6 text-aarthikaBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Fetching Database...</div>}

          {!loading && !error && (
            <div className="premium-card overflow-hidden shadow-lg border-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200">
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Profile Image</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Customer Name</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Father's Name</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Village/Address</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Contact Number</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((c, i) => (
                      <tr key={c.accountNumber || i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-6">
                          {c.photoLink ? (
                            <a href={c.photoLink} target="_blank" rel="noreferrer" className="inline-block relative group">
                               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-aarthikaBlue/20 group-hover:border-aarthikaBlue transition-all shadow-sm">
                                  <img src={c.photoLink} alt="Profile" className="w-full h-full object-cover" />
                               </div>
                            </a>
                          ) : <span className="text-gray-500 text-xs font-semibold bg-gray-100 py-1.5 px-3 rounded-md">NO IMAGE</span>}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-800">{c.customerName || '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{c.fathersName || '-'}</td>
                        <td className="py-4 px-6 text-gray-600">{c.village || '-'}</td>
                        <td className="py-4 px-6 font-medium text-gray-700">{c.phone || '-'}</td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => openLedger(c)} className="text-aarthikaBlue font-semibold hover:text-indigo-900 transition-colors inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg">
                            View Ledger <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-500 font-medium">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            <p>No Customer Records matching query.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER SCREEN: CREATE ACCOUNT ---
  if (view === 'CREATE') {
    return (
      <div className="bg-gray-50 min-h-screen py-10 font-sans">
        <div className="premium-container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => setView('SEARCH')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 font-semibold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Search
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 tracking-tight">Open New Account</h1>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="premium-card p-8 md:col-span-3 shadow-lg border-0">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                <svg className="w-6 h-6 text-aarthikaBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Applicant Details
              </h2>
              <div className="space-y-5">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label><input className="input-premium shadow-sm" value={newCustomer.customerName} onChange={e=>setNewCustomer({...newCustomer, customerName: e.target.value})} placeholder="Enter full name" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Father's Name</label><input className="input-premium shadow-sm" value={newCustomer.fathersName} onChange={e=>setNewCustomer({...newCustomer, fathersName: e.target.value})} placeholder="Enter father's name" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Village/Area</label><input className="input-premium shadow-sm" value={newCustomer.village} onChange={e=>setNewCustomer({...newCustomer, village: e.target.value})} placeholder="Enter residential village" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number *</label><input className="input-premium shadow-sm" value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Enter 10-digit mobile number" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Gov ID (Aadhar/Voter)</label><input className="input-premium shadow-sm" value={newCustomer.aadharId} onChange={e=>setNewCustomer({...newCustomer, aadharId: e.target.value})} placeholder="Enter ID number" /></div>
              </div>
            </div>

            <div className="premium-card p-8 md:col-span-2 flex flex-col items-center justify-center shadow-lg border-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-100 w-full text-center">Official Photograph</h2>
              
              <div className="w-56 h-56 rounded-full ring-8 ring-blue-50 bg-gray-50 flex items-center justify-center overflow-hidden mb-8 shadow-inner">
                {capturedImageBase64 ? (
                  <img src={capturedImageBase64} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-medium">No Photo</span>
                  </div>
                )}
              </div>
              
              <label className="btn text-aarthikaBlue bg-blue-50 border-2 border-aarthikaBlue hover:bg-aarthikaBlue hover:text-white cursor-pointer flex items-center justify-center gap-2 w-full max-w-[240px] shadow-sm font-semibold transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                Open Camera
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleNativeCameraCapture} 
                />
              </label>
              
              {biometricStatus && <div className="text-aarthikaBlue font-semibold mt-6 text-sm bg-blue-50 py-2 px-4 rounded-full border border-blue-100">{biometricStatus}</div>}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button className="btn btn-primary text-lg py-4 px-12 shadow-lg shadow-aarthikaBlue/30 hover:-translate-y-1 transform transition-all flex items-center justify-center gap-3 mx-auto w-full md:w-auto" onClick={submitNewAccount} disabled={createLoading}>
              {createLoading ? (
                 <><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating PDF...</>
              ) : (
                <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Submit Application</>
              )}
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
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="premium-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => setView('SEARCH')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 font-semibold transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Customer List
        </button>

        {/* Customer Profile Header */}
        <div className="premium-card p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-lg border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-brand"></div>
          
          <div className="flex-shrink-0 relative">
            {selectedCustomer?.photoLink ? (
              <img 
                src={selectedCustomer.photoLink} 
                alt="Profile" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-aarthikaBlue/10 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 ring-4 ring-gray-50">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              Customer Profile
              <span className="text-sm font-semibold bg-blue-50 text-aarthikaBlue px-3 py-1 rounded-md border border-blue-100">
                {selectedCustomer?.accountNumber}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
              <div><span className="text-gray-500 block mb-1 font-medium">Full Name</span><strong className="text-gray-800 text-base">{selectedCustomer?.customerName}</strong></div>
              <div><span className="text-gray-500 block mb-1 font-medium">Father's Name</span><strong className="text-gray-800 text-base">{selectedCustomer?.fathersName || '-'}</strong></div>
              <div><span className="text-gray-500 block mb-1 font-medium">Village/Area</span><strong className="text-gray-800 text-base">{selectedCustomer?.village || '-'}</strong></div>
              <div><span className="text-gray-500 block mb-1 font-medium">Phone Number</span><strong className="text-gray-800 text-base">{selectedCustomer?.phone || '-'}</strong></div>
            </div>
          </div>
          
          <div className="w-full md:w-auto text-center md:text-right mt-6 md:mt-0 md:border-l border-gray-100 md:pl-10 md:py-4">
            <div className="text-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">Current Net Balance</div>
            <div className="text-4xl md:text-5xl font-extrabold text-aarthikaBlue tracking-tight">₹{netBalance}</div>
          </div>
        </div>

        {/* Transaction Controls */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="premium-card p-8 bg-green-50/30 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              Deposit Cash
            </h3>
            <div className="flex flex-col gap-5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-bold text-lg">₹</span>
                <input 
                  type="number" 
                  className="input-premium pl-10 text-lg py-3 shadow-sm focus:ring-green-500/20 focus:border-green-500 w-full" 
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="btn bg-green-600 text-white font-semibold text-lg hover:bg-green-700 hover:shadow-lg shadow-green-600/30 transition-all flex items-center justify-center py-3" 
                onClick={() => handleTransaction('DEPOSIT')}
                disabled={transactionLoading}
              >
                {transactionLoading ? 'Processing...' : 'Execute Deposit'}
              </button>
            </div>
          </div>

          <div className="premium-card p-8 bg-orange-50/30 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              Withdraw Cash
            </h3>
            <div className="flex flex-col gap-5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-bold text-lg">₹</span>
                <input 
                  type="number" 
                  className="input-premium pl-10 text-lg py-3 shadow-sm focus:ring-orange-500/20 focus:border-orange-500 w-full" 
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="btn bg-orange-600 text-white font-semibold text-lg hover:bg-orange-700 hover:shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center py-3" 
                onClick={() => handleTransaction('WITHDRAWAL')}
                disabled={transactionLoading}
              >
                {transactionLoading ? 'Processing...' : 'Execute Withdrawal'}
              </button>
            </div>
          </div>
        </div>

        {transactionMsg.text && (
          <div className={`p-4 rounded-xl mb-8 font-semibold text-center shadow-sm border ${transactionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {transactionMsg.text}
          </div>
        )}

        {/* Ledger History */}
        <div className="premium-card overflow-hidden shadow-lg border-0">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Transaction Ledger History</h3>
          </div>
          
          {ledgerLoading ? (
            <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-3 font-medium"><svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Date & Time</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Transaction Type</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Amount (₹)</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Net Balance (₹)</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-5 px-8 text-gray-600 font-medium">{row.timestamp}</td>
                      <td className="py-5 px-8">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${row.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className={`py-5 px-8 font-bold text-lg ${row.type === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'}`}>
                        {row.type === 'DEPOSIT' ? '+' : '-'}{row.amount}
                      </td>
                      <td className="py-5 px-8 font-bold text-gray-800 text-lg">{row.runningBalance}</td>
                      <td className="py-5 px-8"><span className="text-xs font-bold tracking-wide uppercase bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md border border-gray-200">{row.status}</span></td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-gray-500 font-medium text-lg">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          No transactions found for this account.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
