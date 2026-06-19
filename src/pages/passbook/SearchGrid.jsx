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
      <div className="bg-slate-50 min-h-screen py-10 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-extrabold text-slate-900 uppercase tracking-widest">Portal Ledger Access</h1>
            <button onClick={() => setView('CREATE')} className="bg-slate-900 text-white font-bold uppercase tracking-wider text-sm px-6 py-3 rounded-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 mt-4 sm:mt-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Open New Account
            </button>
          </div>

          <div className="bg-white border border-slate-300 p-6 mb-8 flex flex-col sm:flex-row gap-4 items-end shadow-sm rounded-sm">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Customer Database</label>
              <input 
                className="w-full border border-slate-300 px-4 py-3 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Enter Customer Name or Phone Number"
              />
            </div>
            <button onClick={handleSearch} className="bg-slate-900 text-white font-bold uppercase tracking-wider text-sm px-8 py-3 rounded-sm hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto h-[50px] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search Records
            </button>
          </div>

          {biometricStatus && <div className="text-green-800 font-bold mb-4 bg-green-50 p-4 border border-green-300 rounded-sm uppercase text-sm tracking-wide">{biometricStatus}</div>}
          {error && <div className="text-red-800 font-bold mb-4 p-4 bg-red-50 border border-red-300 rounded-sm uppercase text-sm tracking-wide">{error}</div>}
          {loading && <div className="text-slate-600 font-bold flex items-center gap-3 p-4 uppercase text-sm tracking-wider"><svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Querying Master Ledger...</div>}

          {!loading && !error && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                      <th className="py-3 px-6 font-bold text-slate-700 uppercase text-xs tracking-widest border-r border-slate-200">Profile Image</th>
                      <th className="py-3 px-6 font-bold text-slate-700 uppercase text-xs tracking-widest border-r border-slate-200">Customer Name</th>
                      <th className="py-3 px-6 font-bold text-slate-700 uppercase text-xs tracking-widest border-r border-slate-200">Father's Name</th>
                      <th className="py-3 px-6 font-bold text-slate-700 uppercase text-xs tracking-widest border-r border-slate-200">Village/Address</th>
                      <th className="py-3 px-6 font-bold text-slate-700 uppercase text-xs tracking-widest border-r border-slate-200">Contact Number</th>
                      <th className="py-3 px-6 font-bold text-slate-700 uppercase text-xs tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {customers.map((c, i) => (
                      <tr key={c.accountNumber || i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 border-r border-slate-200 text-center">
                          {c.photoLink ? (
                            <a href={c.photoLink} target="_blank" rel="noreferrer" className="inline-block relative">
                               <div className="w-10 h-10 rounded-sm overflow-hidden border border-slate-300 shadow-sm mx-auto">
                                  <img src={c.photoLink} alt="Profile" className="w-full h-full object-cover" />
                               </div>
                            </a>
                          ) : <span className="text-slate-400 text-xs font-bold tracking-wider">N/A</span>}
                        </td>
                        <td className="py-3 px-6 border-r border-slate-200 font-bold text-slate-900">{c.customerName || '-'}</td>
                        <td className="py-3 px-6 border-r border-slate-200 text-slate-700">{c.fathersName || '-'}</td>
                        <td className="py-3 px-6 border-r border-slate-200 text-slate-700">{c.village || '-'}</td>
                        <td className="py-3 px-6 border-r border-slate-200 font-mono text-sm text-slate-800">{c.phone || '-'}</td>
                        <td className="py-3 px-6 text-center">
                          <button onClick={() => openLedger(c)} className="text-slate-900 font-bold text-xs uppercase tracking-wider hover:underline flex items-center justify-center gap-1 mx-auto">
                            View Ledger <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-sm">
                          No Customer Records Located.
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
      <div className="bg-slate-50 min-h-screen py-10 font-sans text-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => setView('SEARCH')} className="text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Return to Ledger Search
          </button>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-8 uppercase tracking-widest border-b-2 border-slate-900 pb-4">Account Origination Form</h1>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="bg-white border border-slate-300 p-8 md:col-span-3 rounded-sm shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b border-slate-200">
                1. Applicant Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label><input className="w-full border border-slate-300 px-3 py-2 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none" value={newCustomer.customerName} onChange={e=>setNewCustomer({...newCustomer, customerName: e.target.value})} placeholder="Legal Full Name" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Father's Name</label><input className="w-full border border-slate-300 px-3 py-2 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none" value={newCustomer.fathersName} onChange={e=>setNewCustomer({...newCustomer, fathersName: e.target.value})} placeholder="Father's Name" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Village / Area</label><input className="w-full border border-slate-300 px-3 py-2 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none" value={newCustomer.village} onChange={e=>setNewCustomer({...newCustomer, village: e.target.value})} placeholder="Residential Village" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Number *</label><input className="w-full border border-slate-300 px-3 py-2 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none font-mono" value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="10-digit Mobile" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gov ID Number</label><input className="w-full border border-slate-300 px-3 py-2 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none font-mono" value={newCustomer.aadharId} onChange={e=>setNewCustomer({...newCustomer, aadharId: e.target.value})} placeholder="Aadhar or Voter ID" /></div>
              </div>
            </div>

            <div className="bg-white border border-slate-300 p-8 md:col-span-2 flex flex-col items-center shadow-sm rounded-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b border-slate-200 w-full text-center">
                2. Official Biometric Record
              </h2>
              
              <div className="w-48 h-48 border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden mb-6 rounded-sm">
                {capturedImageBase64 ? (
                  <img src={capturedImageBase64} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wider mt-2">Awaiting Capture</span>
                  </div>
                )}
              </div>
              
              <label className="bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 cursor-pointer flex items-center justify-center gap-2 w-full max-w-[240px] px-4 py-3 font-bold uppercase tracking-wider text-xs rounded-sm transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                Launch Device Camera
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleNativeCameraCapture} 
                />
              </label>
              
              {biometricStatus && <div className="text-slate-800 font-bold mt-4 text-xs uppercase tracking-wider bg-slate-100 py-2 px-4 border border-slate-300 rounded-sm w-full text-center">{biometricStatus}</div>}
            </div>
          </div>

          <div className="mt-8 text-right border-t border-slate-300 pt-6">
            <button className="bg-slate-900 text-white text-sm font-bold uppercase tracking-widest py-4 px-10 rounded-sm hover:bg-slate-800 transition-colors shadow-sm inline-flex items-center justify-center gap-3 w-full md:w-auto" onClick={submitNewAccount} disabled={createLoading}>
              {createLoading ? (
                 <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing Application...</>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Submit & Issue Passbook</>
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
      </div>
    );
  }

  // --- RENDER SCREEN 2: LEDGER ---
  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => setView('SEARCH')} className="text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Ledger Search
        </button>

        {/* Customer Profile Header */}
        <div className="bg-white border-t-4 border-slate-900 border-x border-b border-slate-300 mb-8 rounded-sm shadow-sm">
          <div className="px-8 py-5 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Master Profile Record</h2>
            <span className="text-xs font-mono font-bold bg-slate-900 text-white px-3 py-1 rounded-sm">
              ACC: {selectedCustomer?.accountNumber}
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center p-8 gap-8">
            <div className="flex-shrink-0">
              {selectedCustomer?.photoLink ? (
                <img 
                  src={selectedCustomer.photoLink} 
                  alt="Profile" 
                  className="w-32 h-32 object-cover border-2 border-slate-300 rounded-sm"
                />
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 rounded-sm">
                  <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div><span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1.5">Legal Name</span><strong className="text-slate-900 text-base">{selectedCustomer?.customerName}</strong></div>
              <div><span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1.5">Father's Name</span><strong className="text-slate-900 text-base">{selectedCustomer?.fathersName || '-'}</strong></div>
              <div><span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1.5">Registered Address</span><strong className="text-slate-900 text-base">{selectedCustomer?.village || '-'}</strong></div>
              <div><span className="text-slate-500 block text-xs uppercase tracking-wider font-bold mb-1.5">Contact Mobile</span><strong className="text-slate-900 text-base font-mono">{selectedCustomer?.phone || '-'}</strong></div>
            </div>
            
            <div className="w-full md:w-auto text-center md:text-right mt-6 md:mt-0 md:border-l border-slate-200 md:pl-10">
              <div className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-widest">Active Balance</div>
              <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">₹{netBalance}</div>
            </div>
          </div>
        </div>

        {/* Transaction Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-300 border-l-4 border-l-slate-800 p-6 rounded-sm shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-5 border-b border-slate-200 pb-2">Record Deposit</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-bold font-mono text-lg">₹</span>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 pl-10 pr-3 py-3 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono text-lg" 
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="bg-slate-900 text-white font-bold uppercase tracking-widest text-xs px-8 py-3 rounded-sm hover:bg-slate-800 transition-colors whitespace-nowrap" 
                onClick={() => handleTransaction('DEPOSIT')}
                disabled={transactionLoading}
              >
                {transactionLoading ? 'Wait...' : 'Execute'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-300 border-l-4 border-l-slate-400 p-6 rounded-sm shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-5 border-b border-slate-200 pb-2">Process Withdrawal</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-bold font-mono text-lg">₹</span>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 pl-10 pr-3 py-3 text-slate-900 rounded-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono text-lg" 
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="bg-slate-600 text-white font-bold uppercase tracking-widest text-xs px-8 py-3 rounded-sm hover:bg-slate-700 transition-colors whitespace-nowrap" 
                onClick={() => handleTransaction('WITHDRAWAL')}
                disabled={transactionLoading}
              >
                {transactionLoading ? 'Wait...' : 'Execute'}
              </button>
            </div>
          </div>
        </div>

        {transactionMsg.text && (
          <div className={`p-4 rounded-sm mb-8 font-bold uppercase tracking-wider text-xs text-center shadow-sm border ${transactionMsg.type === 'error' ? 'bg-red-50 text-red-900 border-red-300' : 'bg-green-50 text-green-900 border-green-300'}`}>
            {transactionMsg.text}
          </div>
        )}

        {/* Ledger History */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
          <div className="bg-slate-100 px-6 py-4 border-b border-slate-300 flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Statement of Operations</h3>
          </div>
          
          {ledgerLoading ? (
            <div className="p-10 text-center text-slate-600 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading Audit Trail...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-300">
                    <th className="py-3 px-6 font-bold text-slate-700 text-xs uppercase tracking-widest border-r border-slate-200">Timestamp</th>
                    <th className="py-3 px-6 font-bold text-slate-700 text-xs uppercase tracking-widest border-r border-slate-200">Type</th>
                    <th className="py-3 px-6 font-bold text-slate-700 text-xs uppercase tracking-widest border-r border-slate-200">Amount (₹)</th>
                    <th className="py-3 px-6 font-bold text-slate-700 text-xs uppercase tracking-widest border-r border-slate-200">Running Balance (₹)</th>
                    <th className="py-3 px-6 font-bold text-slate-700 text-xs uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 font-mono text-xs text-slate-600 border-r border-slate-200">{row.timestamp}</td>
                      <td className="py-3 px-6 border-r border-slate-200">
                        <span className={`inline-block px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-sm ${row.type === 'DEPOSIT' ? 'text-slate-900 border-slate-900 bg-slate-100' : 'text-slate-600 border-slate-400 bg-white'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono font-bold text-sm text-slate-900 border-r border-slate-200">
                        {row.type === 'DEPOSIT' ? '+' : '-'}{row.amount}
                      </td>
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 text-sm border-r border-slate-200">{row.runningBalance}</td>
                      <td className="py-3 px-6 font-bold uppercase tracking-widest text-[10px] text-slate-600">{row.status}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                        No transactions registered on ledger.
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
