import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';
import logoTextUrl from '../../assets/Aarthika (1).png';

const StaffHeader = () => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-aarthikaBlue py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    {/* Abstract background glows */}
    <div className="absolute top-0 right-[10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none transform -translate-y-1/2"></div>
    <div className="absolute bottom-0 left-[20%] w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none transform translate-y-1/2"></div>
    
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10">
      <div className="flex items-center group cursor-default">
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur group-hover:bg-white/40 transition-all duration-500"></div>
          <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 border border-white/30 transform group-hover:scale-105 transition-all duration-300">
            <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
          </div>
        </div>
        <div className="flex flex-col">
          <img src={logoTextUrl} alt="Aarthika" className="h-6 sm:h-8 object-contain origin-left drop-shadow-md" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-blue-200 text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mt-0.5 sm:mt-1 opacity-90">Core Banking System</span>
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-6 z-10">
        <div className="flex flex-col items-end">
          <div className="text-white/60 text-xs font-medium tracking-wider uppercase">Secure Node</div>
          <div className="text-white/90 text-sm font-semibold">HQ-Terminal-01</div>
        </div>
        <div className="h-8 w-px bg-white/20"></div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          </div>
          <span className="text-green-400 text-xs font-bold tracking-widest">NETWORK SECURE</span>
        </div>
      </div>
    </div>
  </div>
);

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
};

const IN_MEMORY_DB_KEY = 'aarthika_passbook_ledgers';

const getSecurePhotoUrl = (link) => {
  try {
    if (!link) return null;
    const strLink = String(link);
    if (strLink.includes('drive.google.com')) {
      const idMatch = strLink.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) return `/api/passbook-image?id=${idMatch[1]}`;
    }
    return strLink;
  } catch (e) {
    console.error("Photo URL parse error:", e);
    return null;
  }
};

export default function SearchGrid() {
  const [view, setView] = useState('SEARCH'); // 'SEARCH' | 'LEDGER' | 'CREATE'
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // Global Escape Key Listener for Power Users
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomedImage) {
          setZoomedImage(null);
        } else if (view !== 'SEARCH') {
          setView('SEARCH');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, zoomedImage]);

  // Auto-focus search bar when returning to SEARCH view
  useEffect(() => {
    if (view === 'SEARCH' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [view]);

  // Biometrics State
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState('');

  // Ledger state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [netBalance, setNetBalance] = useState('0.00');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
    setCurrentPage(1);
    await fetchLedger(customer.accountNumber);
  };


  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState(''); // 'DEPOSIT' | 'WITHDRAWAL'
  const [txAmount, setTxAmount] = useState('');
  const [txMethod, setTxMethod] = useState('CASH'); // 'CASH' | 'UPI'
  const [txFormImage, setTxFormImage] = useState(null);
  const [txPersonImage, setTxPersonImage] = useState(null);

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

  const handleTxCameraCapture = (e, setBase64Str) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
        setBase64Str(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openTxModal = (type) => {
    setTxType(type);
    setTxAmount(type === 'DEPOSIT' ? depositAmount : withdrawAmount);
    setTxMethod('CASH');
    setTxFormImage(null);
    setTxPersonImage(null);
    setTransactionMsg({ type: '', text: '' });
    setTxModalOpen(true);
  };

  const handleTransactionSubmit = async () => {
    if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
      setTransactionMsg({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }
    if (!txFormImage || !txPersonImage) {
      setTransactionMsg({ type: 'error', text: 'Both Form Photo and Person Photo are required for verification.' });
      return;
    }

    setTransactionLoading(true);
    setTransactionMsg({ type: '', text: 'Generating secure PDF receipt...' });

    try {
      const pdfElement = document.getElementById('tx-pdf-template');
      const pdfBase64Str = await html2pdf().from(pdfElement).set({
        margin: [0, 0, 0, 0],
        filename: `Aarthika_TX_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.7 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: 'px', format: [1122, 793], orientation: 'landscape' }
      }).toPdf().output('datauristring');
      
      const cleanPdfBase64 = pdfBase64Str.split(',')[1];

      setTransactionMsg({ type: '', text: 'Uploading PDF to secure vault...' });

      const res = await fetch('/api/passbook-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: selectedCustomer.accountNumber,
          type: txType,
          amount: txAmount,
          method: txMethod,
          pdfFile: cleanPdfBase64
        })
      });
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      setTransactionMsg({ type: 'success', text: `SUCCESS: ${txType} of ₹${txAmount} via ${txMethod} completed. New Balance: ${body.newBalance}` });
      if (txType === 'DEPOSIT') setDepositAmount('');
      if (txType === 'WITHDRAWAL') setWithdrawAmount('');
      setTxModalOpen(false);
      
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
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress aggressively: JPEG at 60% quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setCapturedImageBase64(compressedBase64);
        setBiometricStatus("PHOTO LOCKED. READY TO SUBMIT.");
      };
      img.src = event.target.result;
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
          pdfFile: cleanBase64,
          photoFile: capturedImageBase64.split(',')[1]
        })
      });
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch (err) {
        throw new Error(`Server returned non-JSON response (likely Payload Too Large). Response: ${text.substring(0, 80)}...`);
      }
      
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
      <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-screen font-sans pb-16">
        <StaffHeader />
        
        <div className="premium-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-50 rounded-lg shadow-sm border border-blue-100">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-aarthikaBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </span>
              Master Directory
            </h1>
            <button onClick={() => setView('CREATE')} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-aarthikaBlue/30 hover:-translate-y-1 transition-all duration-300 py-3 px-6 text-sm sm:text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Originate New Account
            </button>
          </div>

          {/* Epic Search Bar */}
          <div className="relative group mb-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-aarthikaBlue to-indigo-400 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
            <div className="relative bg-white premium-card p-2 sm:p-3 rounded-2xl flex flex-col sm:flex-row gap-2 items-center shadow-xl border-0">
              <div className="flex-1 w-full relative flex items-center">
                <svg className="absolute left-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  ref={searchInputRef}
                  className="w-full text-lg sm:text-xl py-4 pl-14 pr-4 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium outline-none" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder="Enter customer name, ID, or phone number..."
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button onClick={handleSearch} className="btn btn-primary px-8 py-4 sm:py-0 h-14 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto text-lg font-bold shadow-md hover:shadow-lg transition-all">
                Search Records
              </button>
            </div>
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
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {customers.map((c, i) => (
                      <tr 
                        key={c.accountNumber || i} 
                        className="hover:bg-blue-50/60 transition-colors group cursor-pointer focus:outline-none focus:bg-blue-50/60" 
                        onClick={() => openLedger(c)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && openLedger(c)}
                      >
                        <td className="py-5 px-6">
                          {c.photoLink ? (
                            <a href={getSecurePhotoUrl(c.photoLink)} target="_blank" rel="noreferrer" className="inline-block relative shadow-sm rounded-full" onClick={(e) => e.stopPropagation()}>
                               <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white ring-2 ring-aarthikaBlue/20 hover:ring-aarthikaBlue transition-all">
                                  <img src={getSecurePhotoUrl(c.photoLink)} alt="Profile" className="w-full h-full object-cover" />
                               </div>
                            </a>
                          ) : (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white ring-2 ring-gray-100 flex items-center justify-center bg-gray-50 text-gray-300 shadow-sm">
                              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-6 font-bold text-gray-800 text-base">{c.customerName || '-'}</td>
                        <td className="py-5 px-6 text-gray-600 font-medium">{c.fathersName || '-'}</td>
                        <td className="py-5 px-6 text-gray-600 font-medium">{c.village || '-'}</td>
                        <td className="py-5 px-6 font-semibold text-gray-700 bg-gray-50/50">{c.phone || '-'}</td>
                        <td className="py-5 px-6 text-right">
                          <button className="text-aarthikaBlue font-bold hover:text-indigo-900 transition-all inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl border border-blue-100 group-hover:shadow-md">
                            View Ledger <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
      <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-screen font-sans pb-16">
        <StaffHeader />
        
        <div className="premium-container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-50 rounded-lg shadow-sm border border-blue-100 text-aarthikaBlue">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </span>
              Account Origination
            </h1>
            <button onClick={() => setView('SEARCH')} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-bold transition-all bg-white hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Cancel & Return
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="premium-card p-8 md:col-span-3 shadow-xl border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-brand"></div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                <svg className="w-6 h-6 text-aarthikaBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Applicant Details
              </h2>
              <div className="space-y-5">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label><input id="input-name" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-fname')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.customerName} onChange={e=>setNewCustomer({...newCustomer, customerName: toTitleCase(e.target.value)})} placeholder="Enter full name" autoComplete="new-password" spellCheck="false" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Father's Name</label><input id="input-fname" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-village')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.fathersName} onChange={e=>setNewCustomer({...newCustomer, fathersName: toTitleCase(e.target.value)})} placeholder="Enter father's name" autoComplete="new-password" spellCheck="false" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Residential Village</label><input id="input-village" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-phone')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.village} onChange={e=>setNewCustomer({...newCustomer, village: toTitleCase(e.target.value)})} placeholder="Enter village or district" autoComplete="new-password" spellCheck="false" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Mobile Number *</label><input id="input-phone" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-aadhar')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.phone} onChange={e=>{const val = e.target.value.replace(/\D/g, ''); if(val.length <= 10) setNewCustomer({...newCustomer, phone: val})}} placeholder="10-digit number" autoComplete="new-password" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Gov. ID (Aadhar/Voter) *</label><input id="input-aadhar" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitNewAccount(); } }} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.aadharId} onChange={e=>setNewCustomer({...newCustomer, aadharId: e.target.value.toUpperCase()})} placeholder="Enter ID number" autoComplete="new-password" spellCheck="false" /></div>
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
      </div>
    );
  }

  // --- RENDER SCREEN 2: LEDGER ---
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-screen font-sans pb-16">
      <StaffHeader />
      
      <div className="premium-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 rounded-lg shadow-sm border border-indigo-100 text-aarthikaBlue">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </span>
            Account Ledger
          </h1>
          <button onClick={() => setView('SEARCH')} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-bold transition-all bg-white hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Close Profile
          </button>
        </div>

        {/* Customer Profile Header */}
        <div className="premium-card p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-xl border-0 relative overflow-hidden bg-white/90 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-brand"></div>
          
          <div className="flex-shrink-0 relative">
            {selectedCustomer?.photoLink ? (
              <img 
                src={getSecurePhotoUrl(selectedCustomer.photoLink)} 
                alt="Profile" 
                onClick={() => setZoomedImage(getSecurePhotoUrl(selectedCustomer.photoLink))}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-aarthikaBlue/10 shadow-md cursor-pointer hover:ring-aarthikaBlue transition-all hover:scale-105"
                title="Click to enlarge"
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
            <div className="text-4xl md:text-5xl font-extrabold text-aarthikaBlue tracking-tight">{netBalance.startsWith('₹') ? netBalance : `₹${netBalance}`}</div>
          </div>
        </div>

        {/* Transaction Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="premium-card p-6 bg-green-50/30 border border-green-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              Deposit Funds
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-bold text-base">₹</span>
                <input 
                  type="number" 
                  className="input-premium pl-8 text-base py-2.5 shadow-sm focus:ring-green-500/20 focus:border-green-500 w-full" 
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openTxModal('DEPOSIT')}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="btn bg-green-600 text-white font-semibold text-base hover:bg-green-700 hover:shadow-lg shadow-green-600/30 transition-all px-6 py-2.5 whitespace-nowrap" 
                onClick={() => openTxModal('DEPOSIT')}
              >
                Initiate
              </button>
            </div>
          </div>

          <div className="premium-card p-6 bg-orange-50/30 border border-orange-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              Withdraw Funds
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-bold text-base">₹</span>
                <input 
                  type="number" 
                  className="input-premium pl-8 text-base py-2.5 shadow-sm focus:ring-orange-500/20 focus:border-orange-500 w-full" 
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openTxModal('WITHDRAWAL')}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="btn bg-orange-600 text-white font-semibold text-base hover:bg-orange-700 hover:shadow-lg shadow-orange-600/30 transition-all px-6 py-2.5 whitespace-nowrap" 
                onClick={() => openTxModal('WITHDRAWAL')}
              >
                Initiate
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
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Type / Method</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Amount (₹)</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Net Balance (₹)</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Proof</th>
                    <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledger.map((row, index) => {
                    const date = row.timestamp || 'Unknown';
                    const type = row.type || '';
                    const amount = row.amount || '0.00';
                    const balance = row.runningBalance || '0.00';
                    const status = row.status || 'PENDING';
                    const method = row.method || 'CASH';
                    const pdfLink = row.pdfLink || '';

                    return (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-8 text-sm text-gray-600 font-medium">{date}</td>
                        <td className="py-4 px-8">
                          <div className="flex flex-col">
                            <span className={`inline-flex items-center w-fit px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {type}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{method}</span>
                          </div>
                        </td>
                        <td className={`py-4 px-8 text-sm font-bold ${type === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'}`}>
                          {type === 'DEPOSIT' ? '+' : '-'}{amount}
                        </td>
                        <td className="py-4 px-8 text-sm font-bold text-gray-800">{balance}</td>
                        <td className="py-4 px-8">
                          <div className="flex gap-2">
                            {pdfLink ? (
                              <a href={pdfLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-bold text-xs border border-red-100" title="View PDF Receipt">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                RECEIPT
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-8 text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-gray-200 text-gray-500 bg-gray-50">
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-gray-500 font-medium text-lg">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          No transactions found for this account.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {Math.ceil(ledger.length / itemsPerPage) > 1 && (
                <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, ledger.length)}</span> of <span className="font-bold text-gray-800">{ledger.length}</span> transactions
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(ledger.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(ledger.length / itemsPerPage)}
                      className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Profile" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-4 ring-white/20"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Transaction Modal Overlay */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 border-b text-white sticky top-0 z-10 flex justify-between items-center ${txType === 'DEPOSIT' ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-orange-600 to-orange-500'}`}>
              <h2 className="text-xl font-bold uppercase tracking-wide">
                Secure {txType} Authentication
              </h2>
              <button onClick={() => !transactionLoading && setTxModalOpen(false)} className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Final Amount (₹)</label>
                  <input 
                    type="number" 
                    className={`input-premium w-full text-xl font-bold py-3 ${txType === 'DEPOSIT' ? 'focus:border-green-500 focus:ring-green-500/20' : 'focus:border-orange-500 focus:ring-orange-500/20'}`}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    disabled={transactionLoading}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${txMethod === 'CASH' ? 'bg-white shadow-sm text-aarthikaBlue' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setTxMethod('CASH')}
                      disabled={transactionLoading}
                    >
                      CASH
                    </button>
                    <button 
                      className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${txMethod === 'UPI' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setTxMethod('UPI')}
                      disabled={transactionLoading}
                    >
                      UPI
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Verification Capture (Mandatory)</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Form Capture */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      id="formCamera" 
                      className="hidden" 
                      onChange={(e) => handleTxCameraCapture(e, setTxFormImage)}
                      disabled={transactionLoading}
                    />
                    <label htmlFor="formCamera" className={`block w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${txFormImage ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                      {txFormImage ? (
                        <div className="relative w-full h-full">
                          <img src={txFormImage} alt="Form" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Retake Photo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 mb-3 group-hover:text-aarthikaBlue group-hover:scale-110 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-gray-600">Scan Filled Form</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Person Capture */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="user" 
                      id="personCamera" 
                      className="hidden" 
                      onChange={(e) => handleTxCameraCapture(e, setTxPersonImage)}
                      disabled={transactionLoading}
                    />
                    <label htmlFor="personCamera" className={`block w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${txPersonImage ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                      {txPersonImage ? (
                        <div className="relative w-full h-full">
                          <img src={txPersonImage} alt="Person" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Retake Photo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 mb-3 group-hover:text-aarthikaBlue group-hover:scale-110 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-gray-600">Scan Customer Face</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {transactionMsg.text && (
                <div className={`p-4 rounded-xl mb-6 font-semibold text-center text-sm shadow-sm border ${transactionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {transactionMsg.text}
                </div>
              )}

              <button 
                onClick={handleTransactionSubmit}
                disabled={transactionLoading || !txAmount || !txFormImage || !txPersonImage}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
                  transactionLoading || !txAmount || !txFormImage || !txPersonImage
                    ? 'bg-gray-300 cursor-not-allowed opacity-70 shadow-none'
                    : txType === 'DEPOSIT' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30 hover:shadow-green-600/50'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30 hover:shadow-orange-600/50'
                }`}
              >
                {transactionLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Uploading Assets & Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Confirm & Secure {txType}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Template for Transactions */}
      <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none z-[-1]">
        <div id="tx-pdf-template" className="w-[1122px] h-[793px] bg-white text-gray-900 p-12 flex flex-col font-sans border-8 border-gray-100 box-border relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full opacity-50"></div>
          
          <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">ā</div>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">aarthikā</h1>
                <p className="text-gray-500 font-bold tracking-widest text-sm uppercase mt-1">Official Transaction Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-800 uppercase tracking-wider">{txType}</div>
              <div className="text-gray-500 font-mono mt-2 text-lg">TXN-{new Date().getTime().toString().slice(-6)}</div>
            </div>
          </div>

          <div className="flex-1 flex gap-12 relative z-10">
            <div className="flex-1 flex flex-col gap-8">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Account Details</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div><span className="text-xs text-gray-500 block mb-1">Customer Name</span><strong className="text-xl text-gray-800">{selectedCustomer?.customerName}</strong></div>
                  <div><span className="text-xs text-gray-500 block mb-1">Account Number</span><strong className="text-xl text-aarthikaBlue font-mono">{selectedCustomer?.accountNumber}</strong></div>
                  <div><span className="text-xs text-gray-500 block mb-1">Father's Name</span><strong className="text-lg text-gray-800">{selectedCustomer?.fathersName || 'N/A'}</strong></div>
                  <div><span className="text-xs text-gray-500 block mb-1">Date & Time</span><strong className="text-lg text-gray-800">{new Date().toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-auto">
                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Transaction Details</h2>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-blue-500 block mb-1 font-bold">Payment Method</span>
                    <strong className="text-2xl text-blue-900 bg-white px-4 py-1 rounded-lg border border-blue-200 inline-block">{txMethod}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-500 block mb-1 font-bold">Final Amount</span>
                    <strong className="text-5xl font-black text-blue-600">₹{parseFloat(txAmount || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[450px] flex flex-col gap-6">
              <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm">
                <div className="absolute top-0 left-0 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10 backdrop-blur-sm">CUSTOMER FACE</div>
                {txPersonImage && <img src={txPersonImage} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm">
                <div className="absolute top-0 left-0 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10 backdrop-blur-sm">FORM / DOCUMENT</div>
                {txFormImage && <img src={txFormImage} className="w-full h-full object-cover" />}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-gray-400">
            <div>Aarthika Core Banking System</div>
            <div>Secure Node HQ-Terminal-01</div>
            <div>{new Date().toISOString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
