import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';
import logoTextUrl from '../../assets/Aarthika (1).png';

const OfficerHeader = ({ officerName, onLogout }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-purple-900 py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center group cursor-default">
        <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5">
          <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 tracking-tight flex items-center gap-2">
            AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">JEWELLERY POS</span>
          </span>
          <span className="text-purple-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Premium Sales Terminal</span>
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
    const saved = localStorage.getItem('aarthika_staff_auth'); // Reusing the same auth logic
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
      return true; // network error fallback
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
    itemDescription: '',
    totalValue: ''
  });
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

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

  const submitSale = async () => {
    if (!saleData.customerName || !saleData.totalValue) return showToast("Required fields missing", "error");
    setCreateLoading(true);
    try {
      const payload = {
        ...saleData,
        branchName: officerAuth.branchName,
        officerName: officerAuth.staffName,
        customerPhoto: customerPhoto ? customerPhoto.split(',')[1] : null
      };

      const res = await fetch('/api/jewellery-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit sale');

      showToast(`Sale recorded successfully! Invoice: ${data.invoiceNo}`, "success");
      setSaleData({ customerName: '', customerPhone: '', itemDescription: '', totalValue: '' });
      setCustomerPhoto('');
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
      <div className="bg-gradient-to-br from-gray-900 via-[#0d0d14] to-purple-900 min-h-screen flex items-center justify-center p-4">
        <ToastComponent />
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-12 rounded-[2rem] shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <div className="text-purple-400 tracking-[0.2em] text-xs font-bold uppercase">Jewellery POS Authentication</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" className="w-full bg-white/5 border border-white/10 text-white placeholder-white/50 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} placeholder="Officer ID" required />
            <input type="password" className="w-full bg-white/5 border border-white/10 text-white placeholder-white/50 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="Password" required />
            {authError && <div className="text-red-400 text-sm font-semibold">{authError}</div>}
            <button type="submit" disabled={authLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all">
              {authLoading ? 'Verifying...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <ToastComponent />
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} />
      
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Record New Sale</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Customer Name</label>
              <input type="text" className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" value={saleData.customerName} onChange={e => setSaleData({...saleData, customerName: e.target.value})} placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
              <input type="tel" className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" value={saleData.customerPhone} onChange={e => setSaleData({...saleData, customerPhone: e.target.value})} placeholder="10-digit number" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Item Description</label>
              <input type="text" className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" value={saleData.itemDescription} onChange={e => setSaleData({...saleData, itemDescription: e.target.value})} placeholder="e.g. 22k Gold Ring - 10 grams" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Total Bill Value (₹)</label>
              <input type="number" className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-xl font-bold text-gray-900" value={saleData.totalValue} onChange={e => setSaleData({...saleData, totalValue: e.target.value})} placeholder="0.00" />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">Customer Photo (Optional for trial)</label>
            <input type="file" accept="image/*" capture="environment" id="cam" className="hidden" onChange={(e) => handleCameraCapture(e, setCustomerPhoto)} />
            <div 
              onClick={() => document.getElementById('cam').click()}
              className={`w-full sm:w-48 h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden ${customerPhoto ? 'border-purple-500' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              {customerPhoto ? <img src={customerPhoto} className="w-full h-full object-cover" /> : <span className="text-gray-400 font-medium">Click to Capture</span>}
            </div>
          </div>

          <button onClick={submitSale} disabled={createLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg">
            {createLoading ? 'Processing...' : 'Submit Sale & Generate Bills'}
          </button>
        </div>
      </div>
    </div>
  );
}
