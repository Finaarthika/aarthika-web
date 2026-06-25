import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/4.png';

const OfficerHeader = ({ officerName, onLogout, onBack }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-emerald-900 py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-white hover:text-emerald-300 transition-colors bg-white/5 p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex items-center group cursor-default">
          <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5">
            <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 to-teal-400 tracking-tight flex items-center gap-2">
              AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">OPEN ORDERS</span>
            </span>
            <span className="text-emerald-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Tracking Terminal</span>
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

export default function OpenOrders() {
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

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });
  
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const verifyAuthSentinel = async (authObj) => {
    try {
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authObj.userId, password: authObj.password, action: 'login', deviceId: getDeviceId() })
      });
      if (!res.ok) {
        handleLogout();
        showToast("Session expired or invalid.", "error");
      }
    } catch (err) {
      // Offline or network error
    }
  };

  useEffect(() => {
    if (officerAuth.loggedIn) {
       verifyAuthSentinel(officerAuth);
       fetchOpenOrders();
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
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      const newAuth = { loggedIn: true, userId: loginForm.userId, password: loginForm.password, staffName: data.staffName };
      setOfficerAuth(newAuth);
      localStorage.setItem('aarthika_staff_auth', JSON.stringify(newAuth));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
    localStorage.removeItem('aarthika_staff_auth');
  };

  const fetchOpenOrders = async () => {
      setLoadingOrders(true);
      setFetchError('');
      try {
          const res = await fetch('/api/open-orders');
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
          setOrders(data.openOrders || []);
      } catch (err) {
          setFetchError(err.message);
      } finally {
          setLoadingOrders(false);
      }
  };

  if (!officerAuth.loggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="flex justify-center mb-6">
            <img src={logoIcon} alt="Aarthika" className="w-20 h-20 rounded-full shadow-lg" />
          </div>
          <h2 className="text-2xl font-black text-center text-[#1B1464] mb-2 font-nirand">SECURITY GATEWAY</h2>
          <p className="text-center text-sm font-semibold text-teal-500 tracking-widest uppercase mb-8">Open Orders Access</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Officer ID</label>
              <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-gray-50/50" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} required placeholder="Enter ID" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Terminal Password</label>
              <input type="password" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-gray-50/50" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required placeholder="••••••••" />
            </div>
            {authError && <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg text-center border border-red-100">{authError}</div>}
            <button type="submit" disabled={authLoading} className="w-full bg-[#1B1464] hover:bg-emerald-900 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(27,20,100,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(27,20,100,0.6)] hover:-translate-y-0.5 transition-all duration-300">
              {authLoading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
            </button>
          </form>
          <button onClick={() => navigate('/jewellery')} className="mt-6 w-full text-center text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors uppercase tracking-wider">
            ← Back to Hub
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
      if (status === 'OVERDUE') return 'bg-red-100 text-red-800 border-red-200';
      if (status === 'DUE SOON') return 'bg-amber-100 text-amber-800 border-amber-200';
      if (status === 'ON TRACK') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

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
        
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Active Orders Dashboard</h1>
            <button onClick={fetchOpenOrders} disabled={loadingOrders} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors">
                <svg className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                REFRESH
            </button>
        </div>

        {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 font-semibold shadow-sm">
                Error connecting to live data: {fetchError}
            </div>
        )}

        {loadingOrders && orders.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(n => (
                    <div key={n} className="bg-white rounded-[24px] h-64 border border-gray-100 shadow-sm animate-pulse flex flex-col p-6">
                        <div className="w-1/3 h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="w-1/2 h-6 bg-gray-200 rounded mb-6"></div>
                        <div className="flex-grow"></div>
                        <div className="w-full h-10 bg-gray-100 rounded-xl mt-4"></div>
                    </div>
                ))}
            </div>
        ) : orders.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-16 text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">Zero Open Orders</h3>
                <p className="text-gray-500 font-medium max-w-md mx-auto">All custom orders have been successfully fulfilled and checked off. You're fully caught up!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order, idx) => (
                    <div key={idx} className="bg-white rounded-[24px] border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform"></div>
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{order.orderId}</div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide leading-tight">{order.customerName}</h3>
                                <div className="text-xs font-bold text-indigo-600 mt-1">{order.customerPhone}</div>
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 flex-grow relative z-10">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items</div>
                                    <div className="text-sm font-black text-gray-800">{order.totalItems}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Advance Paid</div>
                                    <div className="text-sm font-black text-emerald-600">₹{order.advancePaid || '0.00'}</div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Deadline</div>
                                <div className="text-sm font-black text-gray-800 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {order.expectedDelivery || 'Not Set'}
                                </div>
                            </div>
                        </div>

                        {order.pdfLink ? (
                            <a href={order.pdfLink} target="_blank" rel="noreferrer" className="w-full relative z-10 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors group/btn">
                                <svg className="w-5 h-5 text-indigo-400 group-hover/btn:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                VIEW PDF SLIP
                            </a>
                        ) : (
                            <div className="w-full bg-gray-100 text-gray-400 border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-not-allowed">
                                NO PDF ATTACHED
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
        
      </div>
    </div>
  );
}
