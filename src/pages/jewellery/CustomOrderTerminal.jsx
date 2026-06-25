import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';

const OfficerHeader = ({ officerName, onLogout, onBack }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-indigo-900 py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-white hover:text-indigo-300 transition-colors bg-white/5 p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex items-center group cursor-default">
          <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5">
            <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-indigo-400 tracking-tight flex items-center gap-2">
              AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">CUSTOM ORDERS</span>
            </span>
            <span className="text-indigo-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Advance Terminal</span>
          </div>
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

export default function CustomOrderTerminal() {
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
    return saved ? JSON.parse(saved) : { loggedIn: false, userId: '', password: '', staffName: '' };
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
    if (officerAuth.loggedIn) verifyAuthSentinel(officerAuth);
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
        const newAuth = { loggedIn: true, userId: loginForm.userId, password: loginForm.password, staffName: data.staffName, branchName: data.branchName || 'Main Branch' };
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

  // ORDER STATE
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerPhone: '',
    customerVillage: '',
    advancePaid: ''
  });

  const [orderItems, setOrderItems] = useState([
    {
      id: Date.now(),
      category: '',
      metalType: 'Gold',
      purity: '22K',
      expectedWeight: '',
      notes: '',
      designPhoto: ''
    }
  ]);

  const [createLoading, setCreateLoading] = useState(false);

  const addItem = () => {
    if (orderItems.length >= 6) {
      return showToast("Maximum 6 items allowed per order.", "error");
    }
    setOrderItems([...orderItems, {
      id: Date.now(),
      category: '',
      metalType: 'Gold',
      purity: '22K',
      expectedWeight: '',
      notes: '',
      designPhoto: ''
    }]);
  };

  const removeItem = (id) => {
    if (orderItems.length === 1) return showToast("At least one item is required.", "error");
    setOrderItems(orderItems.filter(i => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setOrderItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleItemCameraCapture = async (e, id) => {
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
      updateItem(id, 'designPhoto', canvas.toDataURL('image/jpeg', 0.7));
    } catch (err) {
      showToast("Error processing camera image.", "error");
    }
  };

  const submitOrder = async () => {
    if (!orderData.customerName || !orderData.customerPhone) {
      return showToast("Please fill all required customer details.", "error");
    }

    for (let item of orderItems) {
      if (!item.category || !item.expectedWeight) {
        return showToast("Please fill Category and Expected Weight for all items.", "error");
      }
    }

    setCreateLoading(true);

    try {
      const dateObj = new Date();
      const ymdStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
      const randHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      const orderId = `ORD-${ymdStr}-${randHex}`;
      
      const payload = {
        orderId,
        date: dateObj.toLocaleDateString('en-GB'),
        ...orderData,
        items: orderItems,
        staffName: officerAuth.staffName
      };

      // 1. Render PDF in background
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '0';
      tempDiv.style.left = '0';
      tempDiv.style.zIndex = '-50';
      document.body.appendChild(tempDiv);
      
      const { createRoot } = await import('react-dom/client');
      const CustomOrderPrint = (await import('./CustomOrderPrint')).default;
      const root = createRoot(tempDiv);
      root.render(React.createElement(CustomOrderPrint, { data: payload }));
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for all images
      
      const element = document.getElementById('custom-order-receipt');
      const opt = {
        margin:       0,
        filename:     `${orderId}.pdf`,
        image:        { type: 'jpeg', quality: 0.8 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1123 },
        jsPDF:        { unit: 'px', format: [1123, 794], orientation: 'landscape', compress: true },
        pagebreak:    { mode: 'css', before: '.page-break' }
      };
      
      const base64Pdf = await html2pdf().set(opt).from(element).output('datauristring');
      const pdfBase64Data = base64Pdf.split(',')[1];
      
      root.unmount();
      document.body.removeChild(tempDiv);

      // Strip heavy designPhotos from the backend payload to prevent 413 Payload Too Large errors
      const backendPayload = {
        ...payload,
        items: payload.items.map(item => {
          const { designPhoto, ...rest } = item;
          return rest;
        })
      };

      // 2. Send to Backend to sync to Drive & Sheets
      const res = await fetch('/api/custom-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backendPayload,
          pdfBase64: pdfBase64Data
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync to database');

      // 3. Trigger download of PDF for internal use
      const link = document.createElement('a');
      link.href = base64Pdf;
      link.download = `${orderId}_Internal.pdf`;
      link.click();

      showToast(`Order Secured: ${orderId}. Synced to Drive!`);
      
      // Reset
      setOrderData({ customerName: '', customerPhone: '', customerVillage: '', advancePaid: '' });
      setOrderItems([{ id: Date.now(), category: '', metalType: 'Gold', purity: '22K', expectedWeight: '', notes: '', designPhoto: '' }]);

    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to process order", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  if (!officerAuth.loggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
          <div className="flex justify-center mb-6">
            <img src={logoIcon} alt="Aarthika" className="w-20 h-20 rounded-full shadow-lg" />
          </div>
          <h2 className="text-2xl font-black text-center text-[#1B1464] mb-2 font-nirand">SECURITY GATEWAY</h2>
          <p className="text-center text-sm font-semibold text-indigo-500 tracking-widest uppercase mb-8">Custom Orders Access</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Officer ID</label>
              <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-gray-50/50" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} required placeholder="Enter ID" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Terminal Password</label>
              <input type="password" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-gray-50/50" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required placeholder="••••••••" />
            </div>
            {authError && <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg text-center border border-red-100">{authError}</div>}
            <button type="submit" disabled={authLoading} className="w-full bg-[#1B1464] hover:bg-indigo-900 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(27,20,100,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(27,20,100,0.6)] hover:-translate-y-0.5 transition-all duration-300">
              {authLoading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
            </button>
          </form>
          <button onClick={() => navigate('/jewellery')} className="mt-6 w-full text-center text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">
            ← Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-inter">
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} onBack={() => navigate('/jewellery')} />
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/20 animate-fade-in-up ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
          <span className="font-bold tracking-wide text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 relative">
          
          {/* Main Left Column */}
          <div className="space-y-6">
            
            {/* Customer Information Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-indigo-100/50 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h2 className="text-sm font-black text-indigo-900 tracking-widest uppercase">Customer Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Customer Full Name <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-gray-50/50" value={orderData.customerName} onChange={e => setOrderData({...orderData, customerName: e.target.value})} placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-gray-50/50" value={orderData.customerPhone} onChange={e => setOrderData({...orderData, customerPhone: e.target.value})} placeholder="10-digit number" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Village / City (Optional)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-gray-50/50" value={orderData.customerVillage} onChange={e => setOrderData({...orderData, customerVillage: e.target.value})} placeholder="Location" />
                </div>
              </div>
            </div>

            {/* Dynamic Items Array */}
            {orderItems.map((item, index) => (
              <div key={item.id} className="bg-white rounded-[24px] shadow-sm border border-purple-100 p-6 sm:p-8 relative">
                
                {/* Delete Item Button */}
                {orderItems.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <span className="text-purple-600 font-black text-sm">{index + 1}</span>
                  </div>
                  <h2 className="text-sm font-black text-purple-900 tracking-widest uppercase">Order Item {index + 1}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jewellery Type (Category) <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50/50" value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} placeholder="e.g. Necklace, Ring, Payal" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Expected Weight (g) <span className="text-red-500">*</span></label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50/50" value={item.expectedWeight} onChange={e => updateItem(item.id, 'expectedWeight', e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Metal Type</label>
                    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50/50" value={item.metalType} onChange={e => { updateItem(item.id, 'metalType', e.target.value); updateItem(item.id, 'purity', e.target.value === 'Gold' ? '22K' : '75%'); }}>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Expected Purity</label>
                    {item.metalType === 'Gold' ? (
                      <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50/50" value={item.purity} onChange={e => updateItem(item.id, 'purity', e.target.value)}>
                        <option value="18K">18K</option>
                        <option value="20K">20K</option>
                        <option value="22K">22K</option>
                        <option value="24K">24K</option>
                      </select>
                    ) : (
                      <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50/50" value={item.purity} onChange={e => updateItem(item.id, 'purity', e.target.value)}>
                        <option value="75%">75%</option>
                        <option value="80%">80%</option>
                        <option value="85%">85%</option>
                        <option value="90%">90%</option>
                        <option value="100%">100%</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-5 mt-6 border-t border-gray-100 pt-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Custom Instructions & Design Notes</label>
                    <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50/50 h-32 resize-none" value={item.notes} onChange={e => updateItem(item.id, 'notes', e.target.value)} placeholder="Note down size, specific patterns, deadlines, etc..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Design Reference (Optional)</label>
                    <div className="relative group w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden hover:border-indigo-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleItemCameraCapture(e, item.id)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                      {item.designPhoto ? (
                        <img src={item.designPhoto} alt="Design" className="w-full h-full object-cover z-10" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-indigo-500 transition-colors p-4 text-center">
                          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Tap to Capture</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Item Button */}
            {orderItems.length < 6 && (
              <button onClick={addItem} className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 font-bold py-4 rounded-[24px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add Another Jewellery Item
              </button>
            )}

          </div>

          {/* Right Action Column */}
          <div className="relative">
            <div className="sticky top-[100px] bg-gradient-to-br from-[#1B1464] to-[#0a0729] rounded-[32px] p-6 shadow-[0_20px_40px_-15px_rgba(27,20,100,0.6)] text-white overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-bl-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
              
              <h3 className="text-sm font-bold text-indigo-300 tracking-widest uppercase mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Order Confirmation
              </h3>

              <div className="space-y-5 mb-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-indigo-200/60 uppercase">Total Items in Order</label>
                    <span className="text-sm font-black text-white">{orderItems.length} Items</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-200/60 uppercase mb-2">Advance Deposit Paid (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">₹</span>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-lg font-black text-white outline-none focus:border-indigo-400 focus:bg-white/10 transition-all placeholder-white/20" value={orderData.advancePaid} onChange={e => setOrderData({...orderData, advancePaid: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
              </div>

              <button 
                onClick={submitOrder}
                disabled={createLoading}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-[#1B1464] font-black py-4 px-6 rounded-2xl shadow-[0_8px_20px_-6px_rgba(251,191,36,0.6)] hover:shadow-[0_12px_25px_-6px_rgba(251,191,36,0.7)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide uppercase"
              >
                {createLoading ? (
                  <span className="animate-pulse">PROCESSING...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save Order & Slip
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-white/50 leading-relaxed font-medium">
                This will save the order details to your Google Drive and generate a multi-page A4 internal slip containing the design photos and notes for your craftsmen.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
