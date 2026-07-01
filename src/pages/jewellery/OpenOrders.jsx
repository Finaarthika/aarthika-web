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
  
  const [goldsmithInputs, setGoldsmithInputs] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAssignGoldsmith = async (rowIndex, orderId) => {
      const gName = goldsmithInputs[orderId];
      if (!gName || !gName.trim()) {
          showToast("Please enter a Goldsmith name.", "error");
          return;
      }
      setActionLoading(true);
      try {
          const res = await fetch('/api/update-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'assign_goldsmith', rowIndex, goldsmithName: gName.trim() })
          });
          if (!res.ok) throw new Error('Failed to assign Goldsmith');
          showToast(`Goldsmith ${gName} assigned successfully!`, "success");
          fetchOpenOrders();
      } catch (err) {
          showToast(err.message, "error");
      } finally {
          setActionLoading(false);
      }
  };

  const handleFulfillOrder = async (rowIndex) => {
      if (!window.confirm("Are you sure you want to fulfill and complete this order? It will be removed from this dashboard.")) return;
      setActionLoading(true);
      try {
          const res = await fetch('/api/update-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'fulfill_order', rowIndex })
          });
          if (!res.ok) throw new Error('Failed to fulfill order');
          showToast("Order securely marked as Fulfilled!", "success");
          fetchOpenOrders();
      } catch (err) {
          showToast(err.message, "error");
      } finally {
          setActionLoading(false);
      }
  };

  useEffect(() => {
    if (!officerAuth.loggedIn) {
      navigate('/jewellery');
    }
  }, [officerAuth.loggedIn, navigate]);

  if (!officerAuth.loggedIn) return null;

  const getStatusColor = (status) => {
      if (status === 'OVERDUE') return 'bg-red-100 text-red-800 border-red-200';
      if (status === 'DUE SOON') return 'bg-amber-100 text-amber-800 border-amber-200';
      if (status === 'ON TRACK') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const unassignedOrders = orders.filter(o => !o.goldsmith || String(o.goldsmith).trim() === '');
  const assignedOrders = orders.filter(o => o.goldsmith && String(o.goldsmith).trim() !== '');

  const renderOrderCard = (order, isUnassigned, keyPrefix) => (
    <div key={`${keyPrefix}-${order.orderId}`} className="bg-white rounded-[24px] border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col group relative overflow-hidden h-full">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{order.orderId}</div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide leading-tight">{order.customerName}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-indigo-600">{order.customerPhone}</span>
                    {order.customerVillage && (
                        <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase">{order.customerVillage}</span>
                        </>
                    )}
                </div>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border whitespace-nowrap ${getStatusColor(order.status)}`}>
                {order.status}
            </div>
        </div>

        <div className="bg-gray-50/80 rounded-xl p-4 mb-4 border border-gray-100 relative z-10">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Items ({order.totalItems})</div>
            <div className="flex flex-wrap gap-2 mb-4">
                {order.items && order.items.map((it, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-sm">
                        <span className="text-emerald-600">{it.type}</span> 
                        <span className="text-gray-300">|</span> 
                        {it.weight}g
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Advance Paid</div>
                    <div className="text-sm font-black text-emerald-600">₹{order.advancePaid || '0.00'}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Deadline</div>
                    <div className="text-sm font-black text-gray-800 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {order.expectedDelivery || 'Not Set'}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-grow"></div>

        {/* Action Area based on Assignment Status */}
        <div className="relative z-10 space-y-3 mt-2">
            {isUnassigned ? (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Karigar Name" 
                        value={goldsmithInputs[order.orderId] || ''}
                        onChange={e => setGoldsmithInputs({...goldsmithInputs, [order.orderId]: e.target.value})}
                        className="w-2/3 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 uppercase"
                    />
                    <button 
                        onClick={() => handleAssignGoldsmith(order.rowIndex, order.orderId)}
                        disabled={actionLoading}
                        className="w-1/3 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition-colors"
                    >
                        ASSIGN
                    </button>
                </div>
            ) : (
                <div className="bg-amber-50 rounded-lg border border-amber-100 p-3 flex justify-between items-center">
                    <div>
                        <div className="text-[9px] font-bold text-amber-600/70 uppercase tracking-widest mb-0.5">Assigned Karigar</div>
                        <div className="text-sm font-black text-amber-800 uppercase">{order.goldsmith}</div>
                    </div>
                    <button 
                        onClick={() => handleFulfillOrder(order.rowIndex)}
                        disabled={actionLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-2 rounded-md shadow-sm transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        FULFILL
                    </button>
                </div>
            )}

            {order.pdfLink ? (
                <a href={order.pdfLink} target="_blank" rel="noreferrer" className="w-full bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors group/btn">
                    <svg className="w-4 h-4 text-indigo-400 group-hover/btn:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    VIEW PDF SLIP
                </a>
            ) : (
                <div className="w-full bg-gray-100 text-gray-400 border border-gray-200 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs cursor-not-allowed">
                    NO PDF
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-outfit">
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} onBack={() => navigate('/jewellery')} />
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/20 animate-fade-in-up ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
          <span className="font-bold tracking-wide text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Active Orders Dashboard</h1>
                <p className="text-sm font-semibold text-gray-500 mt-1">Assign goldsmiths and fulfill completed custom orders.</p>
            </div>
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
                    <div key={n} className="bg-white rounded-[24px] h-72 border border-gray-100 shadow-sm animate-pulse flex flex-col p-6">
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
            <div className="space-y-12">
                {/* Unassigned Section */}
                {unassignedOrders.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-8 bg-amber-400 rounded-full"></div>
                            <h2 className="text-xl font-black text-[#1B1464] tracking-tight uppercase">New Custom Orders <span className="text-sm bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">{unassignedOrders.length}</span></h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {unassignedOrders.map((order) => (
                                renderOrderCard(order, true, 'unassigned')
                            ))}
                        </div>
                    </section>
                )}

                {/* Assigned Section */}
                {assignedOrders.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-8 bg-emerald-400 rounded-full"></div>
                            <h2 className="text-xl font-black text-[#1B1464] tracking-tight uppercase">In Progress (Assigned) <span className="text-sm bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">{assignedOrders.length}</span></h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedOrders.map((order) => (
                                renderOrderCard(order, false, 'assigned')
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}
        
      </div>
    </div>
  );
}
