import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';
import logoTextUrl from '../../assets/Aarthika (1).png';
import premiumLogo from '../../assets/3.png';

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

  // Sales Form State
  const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerVillage: '',
    itemCategory: 'Ring',
    metalType: 'Gold',
    purity: '22k',
    netWeight: '',
    ratePerGram: '',
    makingCharges: '',
    discount: '',
    applyGst: false
  });

  const [customerPhoto, setCustomerPhoto] = useState('');
  const [jewelleryPhoto, setJewelleryPhoto] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');

  // Calculations
  const netWeightNum = parseFloat(saleData.netWeight) || 0;
  const rateNum = parseFloat(saleData.ratePerGram) || 0;
  const makingNum = parseFloat(saleData.makingCharges) || 0;
  const discountNum = parseFloat(saleData.discount) || 0;

  const metalValue = netWeightNum * rateNum;
  let subtotal = metalValue + makingNum - discountNum;
  if (subtotal < 0) subtotal = 0;
  const gstAmount = saleData.applyGst ? (subtotal * 0.03) : 0;
  const grandTotal = subtotal + gstAmount;

  // Format Currency
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
    if (!saleData.customerName || !saleData.customerPhone || !saleData.netWeight || !saleData.ratePerGram) {
      return showToast("Please fill all core billing details (Name, Phone, Weight, Rate).", "error");
    }
    if (!customerPhoto || !jewelleryPhoto) {
      return showToast("Both Customer and Jewellery photos are required for the Vault Record.", "error");
    }

    setCreateLoading(true);
    
    // Open a new tab synchronously to bypass popup blockers
    const newTab = window.open('about:blank', '_blank');
    if (newTab) {
      newTab.document.write('<div style="font-family:sans-serif; text-align:center; margin-top:50px;"><h2>Processing Sale & Generating Secured Bill...</h2><p>Please wait, do not close this tab.</p></div>');
    }

    try {
      // 1. Generate Invoice Number dynamically
      const dateObj = new Date();
      const ymdStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
      const randHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      const invoiceNo = `JS-${ymdStr}-${randHex}`;
      
      // We inject it into the DOM directly for the Vault PDF to pick up immediately
      document.getElementById('vault-inv-display').innerText = invoiceNo;

      // 2. Generate the Internal Vault Record (A4)
      const vaultElement = document.getElementById('vault-pdf-template');
      vaultElement.style.display = 'block'; // Ensure visible for generation
      const vaultPdfBase64Str = await html2pdf().from(vaultElement).set({
        margin: [10, 10, 10, 10],
        filename: `${invoiceNo}_Vault_Record.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).toPdf().output('datauristring');
      vaultElement.style.display = 'none';

      const vaultCleanBase64 = vaultPdfBase64Str.split(',')[1];

      // 3. Send Vault PDF and 14 Columns Data to API
      const payload = {
        invoiceNo,
        date: dateObj.toLocaleDateString('en-GB'),
        branchName: officerAuth.branchName,
        officerName: officerAuth.staffName,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        itemDescription: `${saleData.purity} ${saleData.metalType} ${saleData.itemCategory}`,
        netWeight: netWeightNum,
        ratePerGram: rateNum,
        metalValue: metalValue,
        makingCharges: makingNum,
        gstAmount: gstAmount,
        discount: discountNum,
        grandTotal: grandTotal,
        vaultPdfFile: vaultCleanBase64
      };

      const res = await fetch('/api/jewellery-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync to cloud.');

      // 4. API Success! Setup Native Print
      const printData = {
        invoiceNo,
        date: dateObj.toLocaleDateString('en-GB'),
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        customerVillage: saleData.customerVillage,
        itemCategory: saleData.itemCategory,
        metalType: saleData.metalType,
        purity: saleData.purity,
        netWeight: netWeightNum,
        ratePerGram: rateNum,
        metalValue: metalValue,
        makingCharges: makingNum,
        discount: discountNum,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        jewelleryPhoto: jewelleryPhoto // Passed as base64 or object URL (Base64 preferred for storage)
      };
      
      sessionStorage.setItem('aarthika_current_invoice', JSON.stringify(printData));

      // Redirect the tab we opened earlier to the native print page
      if (newTab) {
        newTab.location.href = '/jewellery/print';
      } else {
        // Fallback if blocked
        window.open('/jewellery/print', '_blank');
      }

      showToast(`Sale recorded successfully! Invoice: ${invoiceNo}`, "success");
      
      // Clear form
      setSaleData({
        customerName: '', customerPhone: '', customerVillage: '',
        itemCategory: 'Ring', metalType: 'Gold', purity: '22k',
        netWeight: '', ratePerGram: '', makingCharges: '', discount: '', applyGst: false
      });
      setCustomerPhoto('');
      setJewelleryPhoto('');

    } catch (err) {
      if (newTab) newTab.close();
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

  return (
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

            {/* Section 2: Jewellery Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-sm tracking-widest text-amber-600 font-bold uppercase mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                Jewellery Particulars
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="col-span-2 sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item Category</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" value={saleData.itemCategory} onChange={e => setSaleData({...saleData, itemCategory: e.target.value})}>
                    <option>Ring</option>
                    <option>Chain</option>
                    <option>Necklace</option>
                    <option>Earrings</option>
                    <option>Bangles</option>
                    <option>Coin</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Metal</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" value={saleData.metalType} onChange={e => setSaleData({...saleData, metalType: e.target.value})}>
                    <option>Gold</option>
                    <option>Silver</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Purity</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" value={saleData.purity} onChange={e => setSaleData({...saleData, purity: e.target.value})}>
                    <option>24k</option>
                    <option>22k</option>
                    <option>18k</option>
                    <option>92.5 (Silver)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Net Weight (grams)</label>
                  <div className="relative">
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg pl-4 pr-8 py-3 text-gray-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" value={saleData.netWeight} onChange={e => setSaleData({...saleData, netWeight: e.target.value})} placeholder="0.00" />
                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold">g</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rate per gram (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                    <input type="number" className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 text-gray-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" value={saleData.ratePerGram} onChange={e => setSaleData({...saleData, ratePerGram: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
              </div>
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
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Making Charges (+)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm" value={saleData.makingCharges} onChange={e => setSaleData({...saleData, makingCharges: e.target.value})} placeholder="0.00" />
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
              </div>

              <div className="p-6 bg-gray-900">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Grand Total</span>
                  <span className="text-3xl font-black text-amber-500 tracking-tighter">{formatINR(grandTotal)}</span>
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
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>JEWELLERY ITEM</h3>
            <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Desc:</strong> {saleData.purity} {saleData.metalType} {saleData.itemCategory}</p>
            <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Weight:</strong> {saleData.netWeight}g</p>
            <div style={{ marginTop: '35px', height: '200px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Metal Value ({saleData.netWeight}g @ {saleData.ratePerGram}/g)</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{metalValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Making Charges</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{makingNum.toFixed(2)}</td>
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
  );
}
