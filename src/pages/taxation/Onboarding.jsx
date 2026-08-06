import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const YesNoRadio = ({ value, onChange }) => (
  <div className="flex items-center gap-4">
    <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(true)}>
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${value ? 'border-green-600' : 'border-gray-400'}`}>
        {value && <div className="w-2 h-2 rounded-full bg-green-600" />}
      </div>
      <span className="text-[13px] font-semibold text-slate-700">Yes</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(false)}>
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!value ? 'border-green-600' : 'border-gray-400'}`}>
        {!value && <div className="w-2 h-2 rounded-full bg-green-600" />}
      </div>
      <span className="text-[13px] font-semibold text-slate-700">No</span>
    </label>
    <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold italic ml-2 cursor-help" title="Information">
      i
    </div>
  </div>
);

const IncomeRow = ({ label, value, onChange, isLast }) => (
  <div className={`flex items-center justify-between py-5 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <span className="text-[15px] font-bold text-slate-800">{label}</span>
    <YesNoRadio value={value} onChange={onChange} />
  </div>
);

export default function Onboarding() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();

  const handleIncomeChange = (key, value) => {
    updateTaxData('incomes', key, value);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold text-slate-800 mb-2">ITR Filing Online - File Your Income Tax Return with Tax2Clone</h1>
        <p className="text-[15px] text-gray-500 font-medium">India's Most Trusted Platform for ITR e-Filing - Revised ITR, Belated Return, Updated Return</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-8 py-2">
          <IncomeRow 
            label={<span>Salary/ Pension Income</span>} 
            value={false} 
            onChange={() => {}} 
          />
          <IncomeRow 
            label={<span>Capital Gains/ Losses (Shares, F&O, Mutual Funds, Property)</span>} 
            value={taxData.incomes.hasCapitalGains} 
            onChange={(val) => handleIncomeChange('hasCapitalGains', val)} 
          />
          <IncomeRow 
            label={<span>Business/ Profession Income</span>} 
            value={taxData.incomes.hasBusiness} 
            onChange={(val) => handleIncomeChange('hasBusiness', val)} 
          />
          <IncomeRow 
            label={<span>House Property (Home Loan/ Rental Income, etc) Income</span>} 
            value={false} 
            onChange={() => {}} 
          />
          <IncomeRow 
            label={<span>Other Sources Income</span>} 
            value={taxData.incomes.hasOtherSources} 
            onChange={(val) => handleIncomeChange('hasOtherSources', val)} 
          />
          <IncomeRow 
            label={<span>Foreign Income</span>} 
            value={false} 
            onChange={() => {}} 
            isLast={true}
          />
        </div>
      </div>

      <div className="flex justify-center mb-12">
        <button 
          onClick={() => navigate('/taxation/bank-accounts')}
          className="bg-[#1b7a43] hover:bg-green-700 text-white font-semibold py-3 px-12 rounded flex items-center gap-2 transition-colors"
        >
          CONTINUE
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>

      {/* Trust Badges */}
      <div className="flex justify-center items-center gap-12 text-sm font-semibold text-slate-700 mb-12">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          4.8 Google Rating
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          3+ Million Satisfied Customers
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          2500 Cr. Tax Saved
        </div>
      </div>
      
      <div className="bg-[#5c85b5] rounded-xl p-6 flex justify-between items-center text-white">
         <div className="flex items-center gap-4">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
           <div>
             <h3 className="font-bold text-lg">Looking for a dedicated CA to handle your taxes?</h3>
             <p className="text-sm opacity-90 flex gap-4 mt-1">
                <span>✓ Post Filing Notice Assistance</span>
                <span>✓ Reliable and Secure</span>
                <span>✓ Lowest Filing Fees</span>
             </p>
           </div>
         </div>
         <button className="bg-white text-slate-800 font-bold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
           Connect with Experts
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
         </button>
      </div>
    </div>
  );
}
