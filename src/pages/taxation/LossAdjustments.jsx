import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, prefix, note }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2 text-gray-500 text-[14px]">{prefix}</span>}
      <input
        type="number"
        value={value === 0 ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-md py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
      />
    </div>
    {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
  </div>
);

export default function LossAdjustments() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const { bfla } = taxData;

  const handleChange = (e) => {
    updateTaxData('bfla', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Loss Adjustments</h1>
        <p className="text-[15px] text-gray-500 font-medium">Brought Forward Losses (BFLA) from previous years</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-lg text-slate-800">Brought Forward Losses</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaxInput 
            label="Brought Forward Business Loss" 
            name="businessLoss"
            value={bfla.businessLoss} 
            onChange={handleChange}
            note="Set off against Business Income only"
            prefix="₹"
          />
          <TaxInput 
            label="Short-Term Capital Loss (STCL)" 
            name="stcgLoss"
            value={bfla.stcgLoss} 
            onChange={handleChange}
            note="Set off against STCG & LTCG"
            prefix="₹"
          />
          <TaxInput 
            label="Long-Term Capital Loss (LTCL)" 
            name="ltcgLoss"
            value={bfla.ltcgLoss} 
            onChange={handleChange}
            note="Set off against LTCG only"
            prefix="₹"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => {
            if (taxData.incomes.hasPrepaidTaxes) navigate('/taxation/taxes-paid');
            else if (taxData.incomes.hasDeductions) navigate('/taxation/deductions');
            else if (taxData.incomes.hasExemptIncome) navigate('/taxation/exempt-income');
            else if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
            else if (taxData.incomes.hasCapitalGains) navigate('/taxation/capital-gains');
            else if (taxData.incomes.hasBusiness) navigate('/taxation/business');
            else navigate('/taxation/bank-accounts');
          }}
          className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => navigate('/taxation/computation')}
            className="bg-[#1b7a43] hover:bg-green-700 text-white font-semibold py-2.5 px-8 rounded flex items-center gap-2 transition-colors"
          >
            COMPUTATION
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
