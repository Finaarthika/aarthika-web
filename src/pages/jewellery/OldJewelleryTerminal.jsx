import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import logoIcon from '../../assets/4.png';

const OfficerHeader = ({ officerName, onLogout }) => (
  <div className="sticky top-0 z-50 w-full bg-[#0D0D14] py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-rose-500/20 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center group cursor-default">
        <div className="relative bg-rose-950 rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 border-2 border-rose-500/30">
          <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-100 to-rose-400 tracking-tight flex items-center gap-2">
            AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/30">OLD SCRAP POS</span>
          </span>
          <span className="text-rose-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Purchase Terminal</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 z-10">
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="text-rose-500/60 text-xs font-medium tracking-wider uppercase">Active Purchaser</div>
          <div className="text-rose-100 text-sm font-semibold">{officerName || 'System'}</div>
        </div>
        <button onClick={onLogout} className="group flex items-center gap-2 bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300">
          <span className="text-sm font-bold text-white group-hover:text-red-400">SECURE LOGOUT</span>
        </button>
      </div>
    </div>
  </div>
);

export default function OldJewelleryTerminal() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const getDeviceId = () => {
    let id = localStorage.getItem('aarthika_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('aarthika_device_id', id);
    }
    return id;
  };

  const [officerAuth, setOfficerAuth] = useState(() => {
    const saved = localStorage.getItem('aarthika_staff_auth');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { loggedIn: false, userId: '', password: '', staffName: '' };
  });

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });

  const verifyAuthSentinel = async (currentAuth) => {
    if (!currentAuth.loggedIn) return false;
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentAuth.userId, action: 'check', deviceId })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        localStorage.removeItem('aarthika_staff_auth');
        setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
        showToast(`SECURITY ALERT: ${data.reason || 'Access Revoked'}.`, 'error');
        return false;
      }
      return true;
    } catch (err) {
      return true;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginForm.userId, password: loginForm.password, action: 'login', deviceId })
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        const newAuth = {
          loggedIn: true,
          userId: loginForm.userId,
          password: loginForm.password,
          staffName: data.staffName
        };
        localStorage.setItem('aarthika_staff_auth', JSON.stringify(newAuth));
        setOfficerAuth(newAuth);
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setAuthError('Network error. Please check connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aarthika_staff_auth');
    setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
  };

  const [liveRates, setLiveRates] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error("Face API models load error", e);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (officerAuth.loggedIn) {
      verifyAuthSentinel(officerAuth);
      fetch('/api/metal-rates')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setLiveRates(data);
        })
        .catch(console.error);

      // Fetch existing customers and their items
      fetch('/api/jewellery-sales')
        .then(res => res.json())
        .then(data => {
           if (data.data) {
             setCustomers(data.data);
           }
        })
        .catch(console.error);
    }
  }, [officerAuth.loggedIn]);

  // Terminal State
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'manual'
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]); // array of indexes
  const [isFaceScanning, setIsFaceScanning] = useState(false);

  // Manual Form State
  const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerVillage: '',
    itemsDescription: '',
    grossWeight: '',
    meltingPurity: '',
    finalValue: ''
  });

  // Common Media State
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [jewelleryPhoto, setJewelleryPhoto] = useState('');
  const [faceVectorStr, setFaceVectorStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);

  // Face Scan Logic
  const handleFaceScanSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!modelsLoaded) {
      return showToast("AI Models not loaded yet. Please wait.", "error");
    }

    setIsFaceScanning(true);
    setSearchQuery('Scanning face...');
    setSearchResults([]);

    try {
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setSearchQuery('');
        setIsFaceScanning(false);
        return showToast("No face detected in photo. Try again.", "error");
      }

      const queryVector = Array.from(detection.descriptor);
      
      let bestMatch = null;
      let lowestDistance = 1000;

      customers.forEach(cust => {
        if (!cust.faceVector) return;
        try {
          const custVector = JSON.parse(cust.faceVector);
          const distance = faceapi.euclideanDistance(new Float32Array(queryVector), new Float32Array(custVector));
          if (distance < 0.5 && distance < lowestDistance) {
            lowestDistance = distance;
            bestMatch = cust;
          }
        } catch(e) {}
      });

      if (bestMatch) {
        setSearchQuery('');
        handleSelectCustomer(bestMatch);
        showToast("Customer found via Face ID!", "success");
        // Also save this photo as the customer photo for the transaction
        const reader = new FileReader();
        reader.onloadend = () => setCustomerPhoto(reader.result);
        reader.readAsDataURL(file);
        setFaceVectorStr(JSON.stringify(queryVector));
      } else {
        setSearchQuery('');
        showToast("No matching customer found.", "error");
      }
    } catch(err) {
      console.error(err);
      setSearchQuery('');
      showToast("Face scan failed.", "error");
    }
    setIsFaceScanning(false);
  };

  const handleTextSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const lowerQ = q.toLowerCase();
    const results = customers.filter(c => 
      (c.customerName && c.customerName.toLowerCase().includes(lowerQ)) ||
      (c.phone && c.phone.toLowerCase().includes(lowerQ)) ||
      (c.village && c.village.toLowerCase().includes(lowerQ))
    );
    
    // Deduplicate by Name+Phone
    const unique = [];
    const seen = new Set();
    results.forEach(r => {
      const key = `${r.customerName}-${r.phone}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    });
    setSearchResults(unique);
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedItems([]);
  };

  const handleToggleItem = (index) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      return [...prev, index];
    });
  };

  // Camera Capture for manual entry and generic photos
  const handleCameraCapture = async (e, setter, isCustomerPhoto = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setter(reader.result);
        if (isCustomerPhoto && modelsLoaded) {
          try {
            const img = await faceapi.bufferToImage(file);
            const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
            if (detection) {
              setFaceVectorStr(JSON.stringify(Array.from(detection.descriptor)));
              showToast("Face logged securely.", "success");
            }
          } catch(e) {}
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute calculated values based on mode
  let calculatedDescription = saleData.itemsDescription;
  let calculatedWeight = Number(saleData.grossWeight) || 0;
  let calculatedPurity = Number(saleData.meltingPurity) || 0;
  
  if (activeTab === 'search' && selectedCustomer) {
    calculatedDescription = selectedItems.map(i => selectedCustomer.items[i].name).join(', ');
    calculatedWeight = selectedItems.reduce((acc, i) => acc + (Number(selectedCustomer.items[i].weight) || 0), 0);
    // Average purity for simplicity if multiple items, otherwise exact
    if (selectedItems.length > 0) {
      calculatedPurity = selectedItems.reduce((acc, i) => acc + (Number(selectedCustomer.items[i].purity) || 0), 0) / selectedItems.length;
    }
  }

  // Calculate Suggested Valuation
  // Assuming gold for now, if name contains silver we could use silver rate. 
  // For safety, we check if description contains "Silver"
  const isSilver = calculatedDescription.toLowerCase().includes('silver');
  const scrapRate = isSilver ? (liveRates?.silverScrapRate || 0) : (liveRates?.goldScrapRate || 0);
  
  // Suggested Valuation = (Weight) * (Scrap Rate) * (Purity/100)
  const suggestedValuation = (calculatedWeight * scrapRate * (calculatedPurity / 100));

  // Determine final value (use manual input if provided, otherwise suggested)
  const finalAgreedValue = Number(saleData.finalValue) || Math.round(suggestedValuation) || 0;

  const handleSubmit = async () => {
    if (activeTab === 'search') {
      if (!selectedCustomer) return showToast('Please select a customer first.', 'error');
      if (selectedItems.length === 0) return showToast('Please select at least one item to purchase.', 'error');
    } else {
      if (!saleData.customerName) return showToast('Customer Name is required', 'error');
      if (!saleData.grossWeight) return showToast('Gross Weight is required', 'error');
    }

    if (!customerPhoto || !jewelleryPhoto) {
      return showToast("Both Customer and Jewellery photos are mandatory.", "error");
    }

    setIsSubmitting(true);
    try {
      const invoiceNo = 'OLD-' + Math.floor(1000 + Math.random() * 9000);
      
      const payload = {
        invoiceNo,
        date: new Date().toLocaleDateString('en-IN'),
        officerName: officerAuth.staffName,
        customerName: activeTab === 'search' ? selectedCustomer.customerName : saleData.customerName,
        customerPhone: activeTab === 'search' ? selectedCustomer.phone : saleData.customerPhone,
        customerVillage: activeTab === 'search' ? selectedCustomer.village : saleData.customerVillage,
        itemsDescription: calculatedDescription,
        grossWeight: calculatedWeight,
        meltingPurity: calculatedPurity,
        finalValue: finalAgreedValue,
        faceVectorStr: faceVectorStr,
        customerPhoto: customerPhoto.split(',')[1],
        jewelleryPhoto: jewelleryPhoto.split(',')[1]
      };

      const res = await fetch('/api/old-jewellery-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast('Purchase Logged Successfully!', 'success');
        
        // Save for printing
        localStorage.setItem('aarthika_old_invoice', JSON.stringify({
          ...payload,
          customerPhoto: customerPhoto // keep full data url for print preview if needed
        }));

        // Reset
        setSaleData({ customerName: '', customerPhone: '', customerVillage: '', itemsDescription: '', grossWeight: '', meltingPurity: '', finalValue: '' });
        setCustomerPhoto('');
        setJewelleryPhoto('');
        setFaceVectorStr('');
        setSelectedCustomer(null);
        setSelectedItems([]);
        
        navigate('/jewellery/old-purchase/print');
      } else {
        showToast(data.error || 'Failed to submit', 'error');
      }
    } catch(err) {
      showToast('Network error', 'error');
    }
    setIsSubmitting(false);
  };

  if (!officerAuth.loggedIn) {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col font-inter">
        <OfficerHeader />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-[#0D0D14]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
             <h2 className="text-2xl font-black text-white mb-6 tracking-tight text-center">Officer Login</h2>
             {authError && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 font-medium text-center">{authError}</div>}
             <form onSubmit={handleLogin} className="space-y-4 relative z-10">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Passbook ID</label>
                 <input type="text" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 transition-colors font-medium" required />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vault Key</label>
                 <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 transition-colors font-medium" required />
               </div>
               <button type="submit" disabled={authLoading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all mt-4">
                 {authLoading ? 'VERIFYING...' : 'AUTHORIZE ACCESS'}
               </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A] text-white flex flex-col font-inter overflow-x-hidden">
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} />
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-fade-in-up flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100' : 'bg-red-950/80 border-red-500/30 text-red-100'
        }`}>
           {toast.type === 'success' ? (
             <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
           ) : (
             <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           )}
           <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Data Entry */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-4 mb-2">
            <button 
              onClick={() => { setActiveTab('search'); setSelectedCustomer(null); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'search' ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)] text-white' : 'bg-[#0D0D14] border border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              SEARCH EXISTING CUSTOMER
            </button>
            <button 
              onClick={() => { setActiveTab('manual'); setSelectedCustomer(null); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'manual' ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)] text-white' : 'bg-[#0D0D14] border border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              MANUAL ENTRY (NEW)
            </button>
          </div>

          {activeTab === 'search' && !selectedCustomer && (
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
               <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 Lookup Customer
               </h3>
               
               <div className="flex gap-4">
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Search by Name, Phone, or Village..." 
                      value={searchQuery}
                      onChange={handleTextSearch}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium placeholder-gray-600"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 
                 <input type="file" accept="image/*" capture="environment" id="face-search" className="hidden" onChange={handleFaceScanSearch} />
                 <button 
                   onClick={() => document.getElementById('face-search').click()}
                   disabled={isFaceScanning || !modelsLoaded}
                   className="bg-white/5 hover:bg-white/10 border border-rose-500/30 hover:border-rose-500 rounded-xl px-6 flex flex-col items-center justify-center gap-1 transition-all"
                 >
                   {isFaceScanning ? (
                     <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                       <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Face Scan</span>
                     </>
                   )}
                 </button>
               </div>

               {/* Search Results */}
               {searchResults.length > 0 && (
                 <div className="mt-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                   {searchResults.map((cust, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => handleSelectCustomer(cust)}
                       className="p-4 border-b border-white/5 hover:bg-rose-500/10 cursor-pointer transition-colors flex justify-between items-center"
                     >
                       <div>
                         <div className="font-bold text-white text-lg">{cust.customerName}</div>
                         <div className="text-xs text-gray-400 font-medium">{cust.village} • Ph: {cust.phone}</div>
                       </div>
                       <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'search' && selectedCustomer && (
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-1">Selected Customer</h3>
                   <div className="text-2xl font-black text-white">{selectedCustomer.customerName}</div>
                   <div className="text-sm text-gray-400 font-medium">{selectedCustomer.village} • {selectedCustomer.phone}</div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-bold text-gray-300">Change</button>
               </div>

               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Previously Purchased Items</h4>
               {(!selectedCustomer.items || selectedCustomer.items.length === 0) ? (
                 <div className="bg-white/5 rounded-xl p-4 text-center text-sm text-gray-400">No previous items found for this customer. Switch to Manual Entry.</div>
               ) : (
                 <div className="space-y-2">
                   {selectedCustomer.items.map((item, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => handleToggleItem(idx)}
                       className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedItems.includes(idx) ? 'bg-rose-500/10 border-rose-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                     >
                       <div className="flex items-center gap-4">
                         <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedItems.includes(idx) ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-600'}`}>
                           {selectedItems.includes(idx) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="font-bold text-white text-sm">{item.name}</div>
                           <div className="text-xs text-gray-400">Wt: {item.weight}g • Purity: {item.purity}%</div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
               <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                 New Customer Details
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
                    <input type="text" value={saleData.customerName} onChange={e => setSaleData({...saleData, customerName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number</label>
                    <input type="text" value={saleData.customerPhone} onChange={e => setSaleData({...saleData, customerPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                 </div>
                 <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Village / City</label>
                    <input type="text" value={saleData.customerVillage} onChange={e => setSaleData({...saleData, customerVillage: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                 </div>
               </div>

               <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mt-8 mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                 Item Assessment
               </h3>
               <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Item Description</label>
                    <input type="text" placeholder="e.g. Old Gold Chain 22K" value={saleData.itemsDescription} onChange={e => setSaleData({...saleData, itemsDescription: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gross Weight (g)</label>
                      <input type="number" step="0.01" value={saleData.grossWeight} onChange={e => setSaleData({...saleData, grossWeight: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Melting Purity (%)</label>
                      <input type="number" step="0.1" value={saleData.meltingPurity} onChange={e => setSaleData({...saleData, meltingPurity: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* Security Vault Photos (Required for both modes) */}
          <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-6 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               Security Vault Photos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Customer Face Scan</label>
                <input type="file" accept="image/*" capture="environment" id="cam-cust" className="hidden" onChange={(e) => handleCameraCapture(e, setCustomerPhoto, true)} />
                <div onClick={() => document.getElementById('cam-cust').click()} className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${customerPhoto ? (faceVectorStr ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-rose-500/50 bg-rose-500/10') : 'border-white/10 hover:border-rose-500/50 bg-white/5'}`}>
                  {customerPhoto ? <img src={customerPhoto} className="w-full h-full object-cover" /> : <div className="text-gray-500 flex flex-col items-center"><svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span className="text-[10px] font-bold uppercase">Tap to Scan</span></div>}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Old Jewellery Item</label>
                <input type="file" accept="image/*" capture="environment" id="cam-jewel" className="hidden" onChange={(e) => handleCameraCapture(e, setJewelleryPhoto)} />
                <div onClick={() => document.getElementById('cam-jewel').click()} className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${jewelleryPhoto ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-rose-500/50 bg-white/5'}`}>
                  {jewelleryPhoto ? <img src={jewelleryPhoto} className="w-full h-full object-cover" /> : <div className="text-gray-500 flex flex-col items-center"><svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span className="text-[10px] font-bold uppercase">Tap to Capture</span></div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Submit */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-black text-white tracking-widest uppercase">Financial Summary</h3>
                 <div className="bg-white/10 text-[9px] font-bold text-amber-400 px-2 py-1 rounded">
                    Gold: {liveRates?.goldScrapRate || 0}/g
                 </div>
               </div>
               
               <div className="space-y-3 text-sm border-b border-white/10 pb-4 mb-4">
                 <div className="flex justify-between">
                   <span className="text-gray-400 font-medium">Gross Weight</span>
                   <span className="text-white font-bold">{calculatedWeight ? `${calculatedWeight} g` : '0 g'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-400 font-medium">Melting Purity</span>
                   <span className="text-white font-bold">{calculatedPurity ? `${calculatedPurity.toFixed(1)}%` : '0 %'}</span>
                 </div>
                 <div className="flex justify-between pt-2 border-t border-white/5">
                   <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">Suggested Valuation</span>
                   <span className="text-emerald-400 font-black">₹{Math.round(suggestedValuation).toLocaleString('en-IN')}</span>
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Final Agreed Value (₹)</label>
                 <input 
                   type="number" 
                   placeholder={Math.round(suggestedValuation).toString()}
                   value={saleData.finalValue}
                   onChange={e => setSaleData({...saleData, finalValue: e.target.value})}
                   className="w-full bg-[#05050A] border border-rose-500/30 rounded-xl px-4 py-4 text-white text-2xl font-black focus:outline-none focus:border-rose-500 transition-colors"
                 />
               </div>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className={`w-full font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 text-sm tracking-wide ${isSubmitting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {isSubmitting ? 'PROCESSING...' : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  SAVE & GENERATE SLIP
                </>
              )}
            </button>
            <p className="text-[9px] text-gray-600 text-center font-medium uppercase tracking-widest leading-relaxed">
              Generates A4 Vault Record &<br/>A5 Customer Receipt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
