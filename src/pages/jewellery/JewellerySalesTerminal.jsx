import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';
import logoTextUrl from '../../assets/Aarthika (1).png';
import premiumLogo from '../../assets/3.png';
import InvoicePrint from './InvoicePrint';

const OfficerHeader = ({ officerName, onLogout }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-amber-900 py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center group cursor-default">
        <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5">
          <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-500 tracking-tight flex items-center gap-2">
            AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">JEWELLERY POS</span>
          </span>
          <span className="text-amber-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Billing Terminal</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 z-10">
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="text-white/60 text-xs font-medium tracking-wider uppercase">Active Officer</div>
          <div className="text-white/90 text-sm font-semibold">{officerName || 'System'}</div>
        </div>
        <button onClick={onLogout} className="group flex items-center gap-2 bg-white/10 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300">
          <span className="text-sm font-bold text-white group-hover:text-red-400">SECURE LOGOUT</span>
        </button>
      </div>
    </div>
  </div>
);

export default function JewellerySalesTerminal() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showPrint, setShowPrint] = useState(false);
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
      try {
        return JSON.parse(saved);
      } catch (e) {}
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

  useEffect(() => {
    if (officerAuth.loggedIn) {
      verifyAuthSentinel(officerAuth);
      fetch('/api/metal-rates')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setLiveRates(data);
        })
        .catch(console.error);
    }
  }, [officerAuth.loggedIn]);

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
          staffName: data.staffName,
          branchName: data.branchName || 'Main Branch'
        };
        setOfficerAuth(newAuth);
        localStorage.setItem('aarthika_staff_auth', JSON.stringify(newAuth));
      } else {
        setAuthError(data.error || 'Invalid credentials or unauthorized device.');
      }
    } catch (err) {
      setAuthError('Network error connecting to Auth Server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aarthika_staff_auth');
    setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
  };

  const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerVillage: '',
    goldMakingCharges: '',
    silverMakingCharges: '',
    discount: '',
    applyGst: false
  });

  const [liveRates, setLiveRates] = useState(null);

  const [silverItems, setSilverItems] = useState([]);
  const [goldItems, setGoldItems] = useState([]);

  const [openOrders, setOpenOrders] = useState([]);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceSearch, setAdvanceSearch] = useState('');

  useEffect(() => {
    if (officerAuth.loggedIn) {
        fetch('/api/open-orders')
          .then(res => res.json())
          .then(data => {
              if (data.openOrders) setOpenOrders(data.openOrders);
          })
          .catch(console.error);
    }
  }, [officerAuth.loggedIn]);

  useEffect(() => {
    if (!liveRates) return;
    let autoSilver = 0;
    let autoGold = 0;
    silverItems.forEach(i => autoSilver += (parseFloat(i.netWeight) || 0) * (liveRates.silverMakingPerGram || 0));
    goldItems.forEach(i => autoGold += ((parseFloat(i.netWeight) || 0) * (liveRates.goldMakingPerGram || 0)) + (liveRates.goldHallmarking || 0));
    
    setSaleData(prev => ({
      ...prev,
      silverMakingCharges: autoSilver > 0 ? autoSilver.toFixed(2) : '',
      goldMakingCharges: autoGold > 0 ? autoGold.toFixed(2) : ''
    }));
  }, [silverItems, goldItems, liveRates]);

  const [customerPhoto, setCustomerPhoto] = useState('');
  const [jewelleryPhoto, setJewelleryPhoto] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const getPurityMultiplier = (purity) => {
    if (!purity) return 1;
    if (purity.includes('%')) return parseFloat(purity) / 100;
    if (purity.includes('K')) return parseFloat(purity) / 24;
    return 1;
  };

  const calculateItemValue = (item) => {
    const w = parseFloat(item.netWeight) || 0;
    const r = parseFloat(item.rate) || 0;
    const mult = getPurityMultiplier(item.purity);
    return w * r * mult;
  };

  const getSilverValue = () => silverItems.reduce((acc, item) => acc + calculateItemValue(item), 0);
  const getGoldValue = () => goldItems.reduce((acc, item) => acc + calculateItemValue(item), 0);

  const metalValue = getSilverValue() + getGoldValue();
  
  let totalNetWeight = 0;
  silverItems.forEach(i => totalNetWeight += (parseFloat(i.netWeight) || 0));
  goldItems.forEach(i => totalNetWeight += (parseFloat(i.netWeight) || 0));

  const goldMakingNum = parseFloat(saleData.goldMakingCharges) || 0;
  const silverMakingNum = parseFloat(saleData.silverMakingCharges) || 0;
  const discountNum = parseFloat(saleData.discount) || 0;
  const advanceDeductionNum = selectedAdvance ? (parseFloat(selectedAdvance.advancePaid) || 0) : 0;

  let subtotal = metalValue + goldMakingNum + silverMakingNum - discountNum;
  if (subtotal < 0) subtotal = 0;
  const gstAmount = saleData.applyGst ? (subtotal * 0.03) : 0;
  const grandTotal = subtotal + gstAmount;
  
  let finalDue = grandTotal - advanceDeductionNum;
  if (finalDue < 0) finalDue = 0;

  const allItems = [
    ...silverItems.map(i => ({ ...i, metalType: 'Silver' })),
    ...goldItems.map(i => ({ ...i, metalType: 'Gold' }))
  ];

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  };

  const handleCameraCapture = async (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const bmp = await window.createImageBitmap(file);
      const canvas = document.createElement('canvas');
      let width = bmp.width; let height = bmp.height;
      if (width > 800) { height *= 800 / width; width = 800; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, width, height);
      setter(canvas.toDataURL('image/jpeg', 0.7));
    } catch (err) {
      showToast("Error processing camera image.", "error");
    }
  };

  const submitSaleAndGenerateBills = async () => {
    if (!saleData.customerName || !saleData.customerPhone) {
      return showToast("Please fill Customer Name and Phone.", "error");
    }
    if (allItems.length === 0) {
      return showToast("Please add at least one jewellery item.", "error");
    }
    
    for (const item of allItems) {
      if (!item.netWeight || !item.rate) {
        return showToast("Please fill weight and rate for all items.", "error");
      }
    }

    if (!customerPhoto || !jewelleryPhoto) {
      return showToast("Both Customer and Jewellery photos are required.", "error");
    }

    setCreateLoading(true);

    try {
      const dateObj = new Date();
      const ymdStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
      const randHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      const invoiceNo = `JS-${ymdStr}-${randHex}`;
      
      const printData = {
        invoiceNo,
        date: dateObj.toLocaleDateString('en-GB'),
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        customerVillage: saleData.customerVillage,
        items: allItems,
        metalValue: metalValue,
        goldMakingCharges: goldMakingNum,
        silverMakingCharges: silverMakingNum,
        discount: discountNum,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        linkedAdvanceOrderId: selectedAdvance ? selectedAdvance.orderId : null,
        linkedAdvanceAmount: advanceDeductionNum,
        linkedAdvanceDate: selectedAdvance ? selectedAdvance.orderDate : null,
        finalDue: finalDue,
        customerPhoto,
        jewelleryPhoto
      };

      // 1. Render Detailed A4 Receipt in background
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '0';
      tempDiv.style.left = '0';
      tempDiv.style.zIndex = '-50';
      document.body.appendChild(tempDiv);
      
      const { createRoot } = await import('react-dom/client');
      const DetailedA4Receipt = (await import('./DetailedA4Receipt')).default;
      const root = createRoot(tempDiv);
      root.render(React.createElement(DetailedA4Receipt, { data: printData }));
      
      // Wait for images to load and React to render
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 2. Generate PDF via html2pdf
      const element = document.getElementById('detailed-a4-receipt');
      const opt = {
        margin:       0,
        filename:     `${invoiceNo}_Vault.pdf`,
        image:        { type: 'jpeg', quality: 0.8 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1040 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true }
      };
      
      const base64Pdf = await html2pdf().set(opt).from(element).output('datauristring');
      const base64Data = base64Pdf.split(',')[1];
      
      // 3. Send to API for Drive Upload & Sheet Logging
      const apiRes = await fetch('/api/jewellery-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...printData,
          officerName: officerAuth.staffName,
          vaultPdfFile: base64Data
        })
      });
      
      root.unmount();
      document.body.removeChild(tempDiv);
      
      if (!apiRes.ok) {
        const errText = await apiRes.text();
        throw new Error(`Failed to save record to Drive/Sheets: ${errText}`);
      }
      
      // 4. Show Standard A5 Print Dialog
      localStorage.setItem('aarthika_current_invoice', JSON.stringify(printData));
      setShowPrint(true);
      
      const handleAfterPrint = () => {
        setShowPrint(false);
        window.removeEventListener('afterprint', handleAfterPrint);
        setSaleData({ customerName: '', customerPhone: '', customerVillage: '', goldMakingCharges: '', silverMakingCharges: '', discount: '', applyGst: false });
        setSilverItems([]);
        setGoldItems([]);
        setCustomerPhoto('');
        setJewelleryPhoto('');
      };
      window.addEventListener('afterprint', handleAfterPrint);
      
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const ToastComponent = () => {
    if (!toast.visible) return null;
    return (
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 duration-300 font-medium tracking-wide text-sm ${toast.type === 'error' ? 'bg-red-600 text-white shadow-red-900/30' : 'bg-[#10b981] text-white shadow-emerald-900/30'}`}>
        {toast.message}
      </div>
    );
  };

  if (!officerAuth.loggedIn) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-[#0d0d14] to-amber-900 min-h-screen flex items-center justify-center p-4">
        <ToastComponent />
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-12 rounded-[2rem] shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <div className="text-amber-400 tracking-[0.2em] text-xs font-bold uppercase">Jewellery POS Authentication</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" className="w-full bg-white/5 border border-white/10 text-white placeholder-white/50 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} placeholder="Officer ID" required />
            <input type="password" className="w-full bg-white/5 border border-white/10 text-white placeholder-white/50 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="Password" required />
            {authError && <div className="text-red-400 text-sm font-semibold">{authError}</div>}
            <button type="submit" disabled={authLoading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all">
              {authLoading ? 'Verifying...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentDateStr = new Date().toLocaleDateString('en-GB');

  if (showPrint) {
    return (
      <div className="w-full min-h-screen bg-white">
        <InvoicePrint />
      </div>
    );
  }

  return (
    <>
    <div className="bg-[#f8f9fa] min-h-screen font-sans pb-20">
      <ToastComponent />
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Data Entry */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Customer */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-sm tracking-widest text-amber-600 font-bold uppercase mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Customer Full Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" value={saleData.customerName} onChange={e => setSaleData({...saleData, customerName: e.target.value})} placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                  <input type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" value={saleData.customerPhone} onChange={e => setSaleData({...saleData, customerPhone: e.target.value})} placeholder="10-digit number" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Village / City (Optional)</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all" value={saleData.customerVillage} onChange={e => setSaleData({...saleData, customerVillage: e.target.value})} placeholder="Location" />
                </div>
              </div>
            </div>

            {/* Section 2: Silver Particulars */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm tracking-widest text-gray-500 font-bold uppercase flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                  Silver Items
                </h2>
                <button 
                  onClick={() => {
                    if (allItems.length >= 6) return showToast("Maximum 6 items allowed.", "error");
                    setSilverItems([...silverItems, { category: 'Payal', purity: '75%', grossWeight: '', netWeight: '', rate: liveRates ? liveRates.silverRate : '' }]);
                  }}
                  className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Silver
                </button>
              </div>

              {silverItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 mb-4 items-end bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500" value={item.category} onChange={e => { const newItems = [...silverItems]; newItems[index].category = e.target.value; setSilverItems(newItems); }} placeholder="e.g. Payal" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Purity</label>
                    <select className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 bg-white outline-none focus:border-amber-500" value={item.purity} onChange={e => { const newItems = [...silverItems]; newItems[index].purity = e.target.value; setSilverItems(newItems); }}>
                      {['75%', '80%', '85%', '90%', '100%'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gross (g)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 outline-none focus:border-amber-500" value={item.grossWeight} onChange={e => { const newItems = [...silverItems]; newItems[index].grossWeight = e.target.value; setSilverItems(newItems); }} placeholder="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Net (g)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 outline-none focus:border-amber-500" value={item.netWeight} onChange={e => { const newItems = [...silverItems]; newItems[index].netWeight = e.target.value; setSilverItems(newItems); }} placeholder="0" />
                  </div>
                  <div className="col-span-3 relative">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate/g (₹)</label>
                    <input type="number" className="w-full border border-gray-300 bg-gray-100 cursor-not-allowed rounded-lg pl-3 pr-8 py-2 text-sm text-gray-600 outline-none" value={item.rate} readOnly placeholder="0" />
                    
                    <button onClick={() => { const newItems = [...silverItems]; newItems.splice(index, 1); setSilverItems(newItems); }} className="absolute right-2 top-[26px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {silverItems.length === 0 && <div className="text-center text-sm text-gray-400 py-4 italic">No Silver items added.</div>}
            </div>

            {/* Section 2.5: Gold Particulars */}
            <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-100 to-transparent opacity-50 pointer-events-none"></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-sm tracking-widest text-yellow-600 font-bold uppercase flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>
                  Gold Items
                </h2>
                <button 
                  onClick={() => {
                    if (allItems.length >= 6) return showToast("Maximum 6 items allowed.", "error");
                    setGoldItems([...goldItems, { category: 'Ring', purity: '22K', grossWeight: '', netWeight: '', rate: liveRates ? liveRates.goldRate : '' }]);
                  }}
                  className="text-xs font-bold bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Gold
                </button>
              </div>

              {goldItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 mb-4 items-end bg-yellow-50/30 p-3 rounded-xl border border-yellow-100 relative group z-10">
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-yellow-700/60 uppercase mb-1">Category</label>
                    <input type="text" className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-500" value={item.category} onChange={e => { const newItems = [...goldItems]; newItems[index].category = e.target.value; setGoldItems(newItems); }} placeholder="e.g. Ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-yellow-700/60 uppercase mb-1">Purity</label>
                    <select className="w-full border border-yellow-200 rounded-lg px-2 py-2 text-sm text-gray-800 bg-white outline-none focus:border-amber-500" value={item.purity} onChange={e => { const newItems = [...goldItems]; newItems[index].purity = e.target.value; setGoldItems(newItems); }}>
                      {['18K', '20K', '22K', '24K'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-yellow-700/60 uppercase mb-1">Gross (g)</label>
                    <input type="number" step="0.01" className="w-full border border-yellow-200 rounded-lg px-2 py-2 text-sm text-gray-800 outline-none focus:border-amber-500" value={item.grossWeight} onChange={e => { const newItems = [...goldItems]; newItems[index].grossWeight = e.target.value; setGoldItems(newItems); }} placeholder="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-yellow-700/60 uppercase mb-1">Net (g)</label>
                    <input type="number" step="0.01" className="w-full border border-yellow-200 rounded-lg px-2 py-2 text-sm text-gray-800 outline-none focus:border-amber-500" value={item.netWeight} onChange={e => { const newItems = [...goldItems]; newItems[index].netWeight = e.target.value; setGoldItems(newItems); }} placeholder="0" />
                  </div>
                  <div className="col-span-3 relative">
                    <label className="block text-[10px] font-bold text-yellow-700/60 uppercase mb-1">Rate/g (₹)</label>
                    <input type="number" className="w-full border border-yellow-200 bg-yellow-100/50 cursor-not-allowed rounded-lg pl-3 pr-8 py-2 text-sm text-yellow-800/70 outline-none" value={item.rate} readOnly placeholder="0" />
                    
                    <button onClick={() => { const newItems = [...goldItems]; newItems.splice(index, 1); setGoldItems(newItems); }} className="absolute right-2 top-[26px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {goldItems.length === 0 && <div className="text-center text-sm text-yellow-700/50 py-4 italic relative z-10">No Gold items added.</div>}
            </div>

            {/* Section 3: Photos (Mandatory for Vault) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-sm tracking-widest text-amber-600 font-bold uppercase mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Security Vault Photos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-3 text-center">Customer Photo</label>
                  <input type="file" accept="image/*" capture="environment" id="cam-cust" className="hidden" onChange={(e) => handleCameraCapture(e, setCustomerPhoto)} />
                  <div onClick={() => document.getElementById('cam-cust').click()} className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${customerPhoto ? 'border-green-500' : 'border-gray-300 hover:border-amber-400 bg-gray-50'}`}>
                    {customerPhoto ? <img src={customerPhoto} className="w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span className="text-sm font-bold">Tap to Capture</span></div>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-3 text-center">Jewellery Photo</label>
                  <input type="file" accept="image/*" capture="environment" id="cam-jewel" className="hidden" onChange={(e) => handleCameraCapture(e, setJewelleryPhoto)} />
                  <div onClick={() => document.getElementById('cam-jewel').click()} className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${jewelleryPhoto ? 'border-green-500' : 'border-gray-300 hover:border-amber-400 bg-gray-50'}`}>
                    {jewelleryPhoto ? <img src={jewelleryPhoto} className="w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span className="text-sm font-bold">Tap to Capture</span></div>}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Billing Engine */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e1e24] text-white rounded-2xl shadow-xl sticky top-28 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-4">
                <h2 className="text-lg font-black tracking-widest uppercase">Live Billing Engine</h2>
              </div>
              
              <div className="p-6 space-y-5 border-b border-gray-700">
                <div className="flex justify-between items-center text-gray-300 text-sm">
                  <span>Metal Value</span>
                  <span className="font-mono">{formatINR(metalValue)}</span>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Silver Making Charges (+)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm" value={saleData.silverMakingCharges} onChange={e => setSaleData({...saleData, silverMakingCharges: e.target.value})} placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gold Making & Hallmarking (+)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm" value={saleData.goldMakingCharges} onChange={e => setSaleData({...saleData, goldMakingCharges: e.target.value})} placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Discount (-)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm" value={saleData.discount} onChange={e => setSaleData({...saleData, discount: e.target.value})} placeholder="0.00" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center text-white font-bold">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatINR(subtotal)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-400">Apply 3% GST</span>
                    <button 
                      type="button"
                      onClick={() => setSaleData({...saleData, applyGst: !saleData.applyGst})}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${saleData.applyGst ? 'bg-amber-500' : 'bg-gray-600'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${saleData.applyGst ? 'translate-x-5.5' : 'translate-x-1'}`}></div>
                    </button>
                  </div>
                  <span className={`font-mono text-sm ${saleData.applyGst ? 'text-amber-400' : 'text-gray-500'}`}>{formatINR(gstAmount)}</span>
                </div>

                <div className="pt-4 border-t border-gray-700">
                   <button 
                     onClick={() => setIsAdvanceModalOpen(true)}
                     className="w-full text-xs font-bold text-amber-500 border border-dashed border-amber-500/50 hover:bg-amber-500/10 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                     {selectedAdvance ? 'Change Linked Advance' : 'Link Custom Order Advance'}
                   </button>
                   
                   {selectedAdvance && (
                     <div className="mt-3 bg-gray-800 border border-amber-500/30 rounded-lg p-3 relative">
                       <button onClick={() => setSelectedAdvance(null)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                       <div className="text-[9px] text-amber-400 font-bold uppercase tracking-widest mb-1">Advance Linked • {selectedAdvance.orderId}</div>
                       <div className="text-sm font-bold text-white">{selectedAdvance.customerName}</div>
                       <div className="flex justify-between items-end mt-1 text-xs">
                         <span className="text-gray-400">{selectedAdvance.orderDate}</span>
                         <span className="font-mono text-red-400 font-bold">- {formatINR(selectedAdvance.advancePaid)}</span>
                       </div>
                     </div>
                   )}
                </div>

              </div>

              <div className="p-6 bg-gray-900">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Grand Total</span>
                  <span className="text-lg font-black text-gray-300 tracking-tighter line-through">{formatINR(grandTotal)}</span>
                </div>
                <div className="flex justify-between items-end mb-6 border-t border-gray-700 pt-2">
                  <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Final Due</span>
                  <span className="text-3xl font-black text-amber-500 tracking-tighter">{formatINR(finalDue)}</span>
                </div>

                <button 
                  onClick={submitSaleAndGenerateBills} 
                  disabled={createLoading} 
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900 font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex justify-center items-center gap-2"
                >
                  {createLoading ? (
                    <span className="animate-pulse">PROCESSING...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      SAVE & BILL
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest">Generates A4 Vault Record & A5 Customer Bill</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HIDDEN PDF TEMPLATES FOR DOM CAPTURE                        */}
      {/* ========================================================= */}
      
      {/* 1. VAULT RECORD (A4 - Kept internal, uploaded to Drive) */}
      <div id="vault-pdf-template" style={{ display: 'none', width: '210mm', padding: '20px', backgroundColor: 'white', color: 'black', fontFamily: 'sans-serif' }}>
        <div style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>INTERNAL VAULT RECORD</h1>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>Mishra Jeweller's Security Protocol</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', margin: 0, fontWeight: 'bold' }}>Invoice: <span id="vault-inv-display"></span></p>
            <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>Date: {currentDateStr}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>CUSTOMER KYC</h3>
            <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Name:</strong> {saleData.customerName}</p>
            <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Phone:</strong> {saleData.customerPhone}</p>
            <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Location:</strong> {saleData.customerVillage || 'N/A'}</p>
            <div style={{ marginTop: '15px', height: '200px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {customerPhoto && <img src={customerPhoto} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />}
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>JEWELLERY ITEMS</h3>
            {allItems.map((item, idx) => (
              <p key={idx} style={{ margin: '3px 0', fontSize: '12px' }}>
                • {item.purity} {item.metalType} {item.category} ({item.netWeight}g)
              </p>
            ))}
            {allItems.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>No items</p>}
            
            <div style={{ marginTop: '15px', height: '200px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {jewelleryPhoto && <img src={jewelleryPhoto} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />}
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'left' }}>Particulars</th>
              <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Metal Value (Combined weight {totalNetWeight}g)</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{metalValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Silver Making Charges</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{silverMakingNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Gold Making & Hallmarking</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{goldMakingNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Discount</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>-{discountNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>GST (3%)</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{gstAmount.toFixed(2)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f9f9f9' }}>
              <td style={{ padding: '12px 8px', border: '1px solid #ccc', textAlign: 'right' }}>GRAND TOTAL</td>
              <td style={{ padding: '12px 8px', border: '1px solid #ccc', textAlign: 'right' }}>{grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '50px', fontSize: '10px', color: '#888', textAlign: 'center' }}>
          System Generated Record • Officer: {officerAuth.staffName} • Branch: {officerAuth.branchName}
        </div>
      </div>



    </div>

      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#1B1464] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg tracking-widest uppercase">Link Custom Order</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="hover:text-red-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 border-b border-gray-100">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text"
                  placeholder="Search by Customer Name or Order ID..."
                  value={advanceSearch}
                  onChange={e => setAdvanceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B1464] focus:ring-2 focus:ring-[#1B1464]/20 outline-none font-bold"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50">
              {openOrders.length === 0 ? (
                 <div className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest">No active custom orders found</div>
              ) : (
                <div className="space-y-4">
                  {openOrders
                    .filter(o => o.orderId.toLowerCase().includes(advanceSearch.toLowerCase()) || o.customerName.toLowerCase().includes(advanceSearch.toLowerCase()))
                    .map((order, idx) => (
                      <div key={idx} onClick={() => { setSelectedAdvance(order); setIsAdvanceModalOpen(false); }} className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all flex justify-between items-center group">
                         <div>
                           <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.orderId}</div>
                           <div className="font-bold text-gray-900">{order.customerName}</div>
                           <div className="text-xs text-gray-500">{order.customerPhone} {order.customerVillage ? `• ${order.customerVillage}` : ''}</div>
                         </div>
                         <div className="text-right">
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Advance Paid</div>
                           <div className="font-black text-emerald-600 text-lg">₹{order.advancePaid}</div>
                           <button className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded font-bold uppercase mt-1 group-hover:bg-amber-500 group-hover:text-white transition-colors">LINK TO BILL</button>
                         </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
