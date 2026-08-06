import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, prefix, note }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2 text-gray-500 text-[14px]">{prefix}</span>}
      <input
        type="text"
        inputMode="numeric"
        value={value === '' || value === 0 || value === undefined || value === null ? '' : value}
        onChange={onChange}
        placeholder={placeholder || ''}
        className={`w-full border border-gray-300 rounded-md py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
      />
    </div>
    {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
  </div>
);

export default function CapitalGains() {
  const { taxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { capitalGains } = taxData;

  const handleCapitalChange = (type, q, val) => {
    updateNestedTaxData('capitalGains', type, q, val === '' ? '' : Number(val));
  };

  const totalStcg = Object.values(capitalGains.stcg).reduce((a,b) => Number(a) + Number(b), 0);
  const totalLtcg = Object.values(capitalGains.ltcg).reduce((a,b) => Number(a) + Number(b), 0);

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Your Capital Gains / Losses Details</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-lg text-slate-800">Short-Term Capital Gains (u/s 111A - 20%)</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">Quarterly breakdown for accurate Advance Tax accrual</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TaxInput label="i. Up to 15-Jun-2025" value={capitalGains.stcg.q1} onChange={(e) => handleCapitalChange('stcg', 'q1', e.target.value)} prefix="₹" />
          <TaxInput label="ii. 16-Jun to 15-Sep" value={capitalGains.stcg.q2} onChange={(e) => handleCapitalChange('stcg', 'q2', e.target.value)} prefix="₹" />
          <TaxInput label="iii. 16-Sep to 15-Dec" value={capitalGains.stcg.q3} onChange={(e) => handleCapitalChange('stcg', 'q3', e.target.value)} prefix="₹" />
          <TaxInput label="iv. 16-Dec to 15-Mar" value={capitalGains.stcg.q4} onChange={(e) => handleCapitalChange('stcg', 'q4', e.target.value)} prefix="₹" />
          <TaxInput label="v. 16-Mar to 31-Mar" value={capitalGains.stcg.q5} onChange={(e) => handleCapitalChange('stcg', 'q5', e.target.value)} prefix="₹" />
        </div>
        
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
          <span className="text-gray-600 font-medium text-[15px]">Total STCG (111A):</span>
          <span className="text-slate-800 font-bold text-lg">₹{totalStcg.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">2</div>
          <h3 className="font-bold text-lg text-slate-800">Long-Term Capital Gains (u/s 112A - 12.5%)</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">Exemption up to ₹1.25 Lakhs available</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TaxInput label="i. Up to 15-Jun-2025" value={capitalGains.ltcg.q1} onChange={(e) => handleCapitalChange('ltcg', 'q1', e.target.value)} prefix="₹" />
          <TaxInput label="ii. 16-Jun to 15-Sep" value={capitalGains.ltcg.q2} onChange={(e) => handleCapitalChange('ltcg', 'q2', e.target.value)} prefix="₹" />
          <TaxInput label="iii. 16-Sep to 15-Dec" value={capitalGains.ltcg.q3} onChange={(e) => handleCapitalChange('ltcg', 'q3', e.target.value)} prefix="₹" />
          <TaxInput label="iv. 16-Dec to 15-Mar" value={capitalGains.ltcg.q4} onChange={(e) => handleCapitalChange('ltcg', 'q4', e.target.value)} prefix="₹" />
          <TaxInput label="v. 16-Mar to 31-Mar" value={capitalGains.ltcg.q5} onChange={(e) => handleCapitalChange('ltcg', 'q5', e.target.value)} prefix="₹" />
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
          <span className="text-gray-600 font-medium text-[15px]">Total LTCG (112A):</span>
          <span className="text-slate-800 font-bold text-lg">₹{totalLtcg.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate(taxData.incomes.hasBusiness ? '/taxation/business' : '/taxation/bank-accounts')} 
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
            onClick={() => {
              if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
              else navigate('/taxation/exempt-income');
            }}
            className="bg-[#1b7a43] hover:bg-green-700 text-white font-semibold py-2.5 px-8 rounded flex items-center gap-2 transition-colors"
          >
            CONTINUE
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
