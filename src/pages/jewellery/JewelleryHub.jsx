import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/4.png';

const OfficerHeader = () => (
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
          <span className="text-amber-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Navigation Hub</span>
        </div>
      </div>
    </div>
  </div>
);

export default function JewelleryHub() {
  const navigate = useNavigate();
  const [baseRates, setBaseRates] = useState({ goldRate: 0, silverRate: 0 });
  const [displayRates, setDisplayRates] = useState({ goldRate: 0, silverRate: 0 });
  const [goldTrend, setGoldTrend] = useState(0);
  const [silverTrend, setSilverTrend] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [todayPurchases, setTodayPurchases] = useState(0);

  const isMarketClosed = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    if (day === 0) return true; // Sunday fully closed
    if (day === 6 && hours >= 23) return true; // Saturday after 11 PM
    return false;
  };

  useEffect(() => {
    // Fetch Metal Rates
    fetch('/api/metal-rates')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setBaseRates({ goldRate: Number(data.goldRate) || 0, silverRate: Number(data.silverRate) || 0 });
          setDisplayRates({ goldRate: Number(data.goldRate) || 0, silverRate: Number(data.silverRate) || 0 });
        }
      })
      .catch(console.error);

    // Fetch Active Custom Orders
    fetch('/api/open-orders')
      .then(res => res.json())
      .then(data => {
        if (data.openOrders) setActiveOrdersCount(data.openOrders.length);
      })
      .catch(console.error);

    // Fetch Today's Purchases
    fetch('/api/old-jewellery-purchase')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
          const todayTotal = data.data
            .filter(item => item.date === todayStr)
            .reduce((sum, item) => {
              const val = parseFloat(String(item.finalValue).replace(/[^0-9.-]+/g, "")) || 0;
              return sum + val;
            }, 0);
          setTodayPurchases(todayTotal);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!baseRates.goldRate || !baseRates.silverRate) return;

    const interval = setInterval(() => {
      if (isMarketClosed()) {
        setDisplayRates(baseRates);
        setGoldTrend(0);
        setSilverTrend(0);
        return;
      }

      setDisplayRates(prev => {
        const goldDrift = (Math.random() - 0.5) * (baseRates.goldRate * 0.002);
        const silverDrift = (Math.random() - 0.5) * (baseRates.silverRate * 0.002);

        let newGold = prev.goldRate + goldDrift;
        let newSilver = prev.silverRate + silverDrift;

        const goldMax = baseRates.goldRate * 1.015;
        const goldMin = baseRates.goldRate * 0.985;
        if (newGold > goldMax) newGold = goldMax;
        if (newGold < goldMin) newGold = goldMin;

        const silverMax = baseRates.silverRate * 1.015;
        const silverMin = baseRates.silverRate * 0.985;
        if (newSilver > silverMax) newSilver = silverMax;
        if (newSilver < silverMin) newSilver = silverMin;

        setGoldTrend(newGold > prev.goldRate ? 1 : (newGold < prev.goldRate ? -1 : 0));
        setSilverTrend(newSilver > prev.silverRate ? 1 : (newSilver < prev.silverRate ? -1 : 0));

        return {
          goldRate: Math.round(newGold),
          silverRate: Math.round(newSilver)
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [baseRates]);

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col font-inter relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <OfficerHeader />
      
      <div className="flex-grow flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="max-w-7xl w-full">
          
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">Command Center</h1>
            <p className="text-gray-400 text-lg max-w-2xl">Select a terminal to proceed. All actions are logged and secured under enterprise vault protocols.</p>
          </div>

          {/* Live Analytics Dashboard Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-amber-500/80 text-xs font-bold tracking-widest uppercase">Live Gold Rate</span>
                {goldTrend !== 0 && (
                  <span className={goldTrend > 0 ? "text-emerald-400" : "text-red-400"}>
                    {goldTrend > 0 ? '▲' : '▼'}
                  </span>
                )}
              </div>
              <span className={`text-3xl font-black transition-colors duration-500 ${goldTrend > 0 ? 'text-emerald-400' : goldTrend < 0 ? 'text-red-400' : 'text-white'}`}>₹{displayRates.goldRate.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ 10g</span></span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-zinc-300/10 rounded-full blur-2xl group-hover:bg-zinc-300/20 transition-all duration-500"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-xs font-bold tracking-widest uppercase">Live Silver Rate</span>
                {silverTrend !== 0 && (
                  <span className={silverTrend > 0 ? "text-emerald-400" : "text-red-400"}>
                    {silverTrend > 0 ? '▲' : '▼'}
                  </span>
                )}
              </div>
              <span className={`text-3xl font-black transition-colors duration-500 ${silverTrend > 0 ? 'text-emerald-400' : silverTrend < 0 ? 'text-red-400' : 'text-white'}`}>₹{displayRates.silverRate.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ kg</span></span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
              <span className="text-indigo-400/80 text-xs font-bold tracking-widest uppercase mb-2">Active Custom Orders</span>
              <span className="text-3xl font-black text-white">{activeOrdersCount} <span className="text-sm font-medium text-gray-400">Orders Pending</span></span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
              <span className="text-rose-400/80 text-xs font-bold tracking-widest uppercase mb-2">Today's Purchases</span>
              <span className="text-3xl font-black text-white">₹{todayPurchases.toLocaleString()} <span className="text-sm font-medium text-gray-400">Value Vaulted</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Retail Billing Terminal Card */}
            <div 
              onClick={() => navigate('/jewellery/retail')}
              className="group relative bg-[#0D0D14]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 lg:p-10 hover:border-amber-500/30 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[320px]"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-amber-500/10 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-shadow">
                  <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-black text-white/30 transition-all duration-300">
                  <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight group-hover:text-amber-400 transition-colors">Retail Checkout</h2>
                <p className="text-gray-400 text-base font-medium leading-relaxed max-w-md">
                  Instant POS terminal. Generate customer receipts, compute live metal rates, and log secure vault images for items leaving the premises.
                </p>
              </div>
            </div>

            {/* Custom Orders Terminal Card */}
            <div 
              onClick={() => navigate('/jewellery/custom-order')}
              className="group relative bg-[#0D0D14]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 lg:p-10 hover:border-indigo-500/30 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[320px]"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-shadow">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white text-white/30 transition-all duration-300">
                  <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight group-hover:text-indigo-400 transition-colors">Custom Orders</h2>
                <p className="text-gray-400 text-base font-medium leading-relaxed max-w-md">
                  Process bespoke requests. Log design references, capture advance deposits, and secure manufacturing details in the system.
                </p>
              </div>
            </div>

            {/* Open Orders Tracker Card */}
            <div 
              onClick={() => navigate('/jewellery/open-orders')}
              className="group relative bg-[#0D0D14]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 lg:p-10 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[320px]"
            >
              <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mb-32 group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-shadow">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white text-white/30 transition-all duration-300">
                  <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight group-hover:text-emerald-400 transition-colors">Active Orders</h2>
                <p className="text-gray-400 text-base font-medium leading-relaxed max-w-md">
                  Monitor pending pipelines. Track target deadlines, access secure Vault PDFs, and manage overdue or prioritized deliveries.
                </p>
              </div>
            </div>

            {/* Old Scrap Purchase Terminal Card */}
            <div 
              onClick={() => navigate('/jewellery/old-purchase')}
              className="group relative bg-[#0D0D14]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 lg:p-10 hover:border-rose-500/30 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[320px]"
            >
              <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-3xl -mr-32 -mb-32 group-hover:bg-rose-500/10 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500/20 to-red-600/10 border border-rose-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.15)] group-hover:shadow-[0_0_40px_rgba(244,63,94,0.3)] transition-shadow">
                  <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:border-rose-500 group-hover:text-white text-white/30 transition-all duration-300">
                  <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight group-hover:text-rose-400 transition-colors">Old Scrap Buy</h2>
                <p className="text-gray-400 text-base font-medium leading-relaxed max-w-md">
                  Purchase customer gold/silver. Perform facial recognition, evaluate deductions, and mint secure vault acquisition records.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
