import React from 'react';
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-inter">
      <OfficerHeader />
      
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Retail Billing Terminal Card */}
          <div 
            onClick={() => navigate('/jewellery/retail')}
            className="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:bg-amber-200 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-[#1B1464] mb-2 tracking-tight">Retail Billing Terminal</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Open the instant checkout POS. Generate customer receipts, calculate live rates, and log vault security photos for items leaving the store.
              </p>
            </div>
            <div className="mt-8 flex items-center text-amber-600 font-bold text-sm tracking-wide group-hover:translate-x-2 transition-transform">
              OPEN TERMINAL <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>

          {/* Custom Orders Terminal Card */}
          <div 
            onClick={() => navigate('/jewellery/custom-order')}
            className="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:bg-indigo-200 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-[#1B1464] mb-2 tracking-tight">Custom Orders & Advances</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Accept custom jewelry orders. Log design instructions, capture reference photos, and accept advance deposits to secure the order.
              </p>
            </div>
            <div className="mt-8 flex items-center text-indigo-600 font-bold text-sm tracking-wide group-hover:translate-x-2 transition-transform">
              OPEN TERMINAL <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>

          {/* Open Orders Tracker Card */}
          <div 
            onClick={() => navigate('/jewellery/open-orders')}
            className="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:bg-emerald-200 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h2 className="text-2xl font-black text-[#1B1464] mb-2 tracking-tight">Active Orders Tracker</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Track pending custom orders. Monitor target deadlines, view attached PDFs, and stay on top of overdue or urgent deliveries.
              </p>
            </div>
            <div className="mt-8 flex items-center text-emerald-600 font-bold text-sm tracking-wide group-hover:translate-x-2 transition-transform">
              OPEN TERMINAL <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
