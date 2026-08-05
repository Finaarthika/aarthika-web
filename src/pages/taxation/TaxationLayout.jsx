import React, { useState } from 'react';
import Onboarding from './Onboarding';
import { TaxationProvider, useTaxation } from './TaxationContext';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BusinessIncome from './BusinessIncome';
import CapitalGains from './CapitalGains';
import OtherSources from './OtherSources';
import LossAdjustments from './LossAdjustments';
import Computation from './Computation';

// Placeholder components for routing
// All routes imported

const SidebarItem = ({ icon, label, path, isActive, onClick }) => (
  <button 
    onClick={() => onClick(path)}
    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
      isActive 
        ? 'bg-blue-600/10 text-blue-500 border-r-4 border-blue-500' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

const TaxationLayout = () => {
  const { taxData } = useTaxation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Dynamically build nav items based on selected incomes
  const navItems = [
    { label: 'Client Profile', path: '/taxation', show: true },
    { label: 'Business & Profession', path: '/taxation/business', show: taxData.incomes.hasBusiness },
    { label: 'Capital Gains', path: '/taxation/capital-gains', show: taxData.incomes.hasCapitalGains },
    { label: 'Other Sources', path: '/taxation/other-sources', show: taxData.incomes.hasOtherSources },
    { label: 'Loss Adjustments', path: '/taxation/adjustments', show: true }, // Always show for BFLA
    { label: 'Computation & Docs', path: '/taxation/computation', show: true },
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121212] border-r border-gray-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white tracking-wide">
            <span className="text-blue-500">Tax</span>Studio
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          <div className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Preparation
          </div>
          {navItems.map((item) => (
            <SidebarItem 
              key={item.path}
              label={item.label}
              path={item.path}
              isActive={currentPath === item.path || (item.path !== '/taxation' && currentPath.startsWith(item.path))}
              onClick={navigate}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => navigate('/')}
            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back to Main Site
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-[#121212] border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
           <h2 className="text-lg font-medium text-gray-200">
             {navItems.find(item => item.path === currentPath)?.label || 'Taxation'}
           </h2>
           <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">AY 2026-27</div>
              <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold">
                C
              </div>
           </div>
        </header>
        
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto bg-[#1a1a1a] rounded-xl border border-gray-800 min-h-[500px] shadow-2xl">
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/business" element={<BusinessIncome />} />
              <Route path="/capital-gains" element={<CapitalGains />} />
              <Route path="/other-sources" element={<OtherSources />} />
              <Route path="/adjustments" element={<LossAdjustments />} />
              <Route path="/computation" element={<Computation />} />
            </Routes>
          </div>
        </div>
      </main>
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
