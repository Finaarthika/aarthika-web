import React from 'react';
import Onboarding from './Onboarding';
import { TaxationProvider, useTaxation } from './TaxationContext';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BusinessIncome from './BusinessIncome';
import CapitalGains from './CapitalGains';
import OtherSources from './OtherSources';
import ExemptIncome from './ExemptIncome';
import Deductions from './Deductions';
import TaxesPaid from './TaxesPaid';
import LossAdjustments from './LossAdjustments';
import Computation from './Computation';
import BankAccounts from './BankAccounts';

const TaxationLayout = () => {
  const { taxData } = useTaxation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Build sequential nav items
  const navItems = [
    { label: 'Sources of Income', path: '/taxation' },
    { label: 'Basic Details', path: '/taxation/bank-accounts' },
    ...(taxData.incomes.hasBusiness ? [{ label: 'Business Income', path: '/taxation/business' }] : []),
    ...(taxData.incomes.hasCapitalGains ? [{ label: 'Capital Gain Income', path: '/taxation/capital-gains' }] : []),
    ...(taxData.incomes.hasOtherSources ? [{ label: 'Other Sources Income', path: '/taxation/other-sources' }] : []),
    ...(taxData.incomes.hasExemptIncome ? [{ label: 'Exempt Income', path: '/taxation/exempt-income' }] : []),
    ...(taxData.incomes.hasDeductions ? [{ label: 'Deductions', path: '/taxation/deductions' }] : []),
    ...(taxData.incomes.hasPrepaidTaxes ? [{ label: 'Prepaid Taxes', path: '/taxation/taxes-paid' }] : []),
    { label: 'Loss Adjustments', path: '/taxation/adjustments' },
    { label: 'Computation', path: '/taxation/computation' },
  ];

  const currentIndex = navItems.findIndex(item => item.path === currentPath || (item.path !== '/taxation' && currentPath.startsWith(item.path)));

  return (
    <div className="min-h-screen bg-[#eaf1f1] font-sans flex flex-col relative pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
          </svg>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Tax2<span className="text-green-600">Clone</span></span>
        </div>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold hover:bg-green-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Profile
        </button>
      </header>

      {/* Stepper Navigation */}
      <div className="w-full bg-[#eaf1f1] border-b border-gray-300 py-3 overflow-x-auto custom-scrollbar sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-2 px-4 w-max">
          {navItems.map((item, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            return (
              <div key={item.path} className="flex items-center">
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-white text-green-700 shadow-sm border border-green-200'
                      : isCompleted
                        ? 'bg-transparent text-green-700'
                        : 'bg-transparent text-gray-500 hover:bg-white/50'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] ${isActive ? 'bg-green-700 text-white' : 'bg-gray-300 text-white'}`}>
                      {index + 1}
                    </span>
                  )}
                  {item.label}
                </button>
                {index < navItems.length - 1 && (
                  <svg className="w-4 h-4 text-gray-400 mx-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 relative">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/bank-accounts" element={<BankAccounts />} />
          <Route path="/business" element={<BusinessIncome />} />
          <Route path="/capital-gains" element={<CapitalGains />} />
          <Route path="/other-sources" element={<OtherSources />} />
          <Route path="/exempt-income" element={<ExemptIncome />} />
          <Route path="/deductions" element={<Deductions />} />
          <Route path="/taxes-paid" element={<TaxesPaid />} />
          <Route path="/adjustments" element={<LossAdjustments />} />
          <Route path="/computation" element={<Computation />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-[#1b7a43] text-white py-3 px-8 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            +91 91166 84439
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            support@tax2clone.in
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function TaxationModule() {
  return (
    <TaxationProvider>
      <TaxationLayout />
    </TaxationProvider>
  );
}
