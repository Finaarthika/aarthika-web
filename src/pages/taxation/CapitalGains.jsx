import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const InputField = ({ label, value, onChange, name, type = "number", prefix = "₹", note }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-500 font-medium">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="0"
        className={`w-full bg-[#121212] border border-gray-800 rounded-lg py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${prefix ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
    {note && <p className="text-xs text-gray-500 mt-2">{note}</p>}
  </div>
);

export default function CapitalGains() {
  const { taxData, updateTaxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { capitalGains } = taxData;

  const handleCapitalChange = (type, q, val) => {
    updateNestedTaxData('capitalGains', type, q, val === '' ? '' : Number(val));
  };

  const totalStcg = Object.values(capitalGains.stcg).reduce((a,b) => Number(a) + Number(b), 0);
  const totalLtcg = Object.values(capitalGains.ltcg).reduce((a,b) => Number(a) + Number(b), 0);

  return (
    <div className="max-w-4xl mx-auto py-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Capital Gains</h2>
        <p className="text-gray-400">Enter your aggregate Short-Term and Long-Term Capital Gains with quarterly breakdown for Advance Tax.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
              Short-Term Capital Gains (u/s 111A - 20%)
            </h3>
            <p className="text-sm text-gray-400 mt-1 ml-10">Quarterly breakdown for accurate Advance Tax accrual</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <InputField label="i. Up to 15-Jun-2025" name="stcg_q1" value={capitalGains.stcg.q1} onChange={(e) => handleCapitalChange('stcg', 'q1', e.target.value)} />
            <InputField label="ii. 16-Jun to 15-Sep" name="stcg_q2" value={capitalGains.stcg.q2} onChange={(e) => handleCapitalChange('stcg', 'q2', e.target.value)} />
            <InputField label="iii. 16-Sep to 15-Dec" name="stcg_q3" value={capitalGains.stcg.q3} onChange={(e) => handleCapitalChange('stcg', 'q3', e.target.value)} />
            <InputField label="iv. 16-Dec to 15-Mar" name="stcg_q4" value={capitalGains.stcg.q4} onChange={(e) => handleCapitalChange('stcg', 'q4', e.target.value)} />
            <InputField label="v. 16-Mar to 31-Mar" name="stcg_q5" value={capitalGains.stcg.q5} onChange={(e) => handleCapitalChange('stcg', 'q5', e.target.value)} />
          </div>
          
          <div className="p-3 bg-[#121212] rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Total STCG (111A): <span className="text-white font-bold text-lg">₹{totalStcg.toLocaleString('en-IN')}</span></p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">2</span>
              Long-Term Capital Gains (u/s 112A - 12.5%)
            </h3>
            <p className="text-sm text-gray-400 mt-1 ml-10">Exemption up to ₹1.25 Lakhs available</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <InputField label="i. Up to 15-Jun-2025" name="ltcg_q1" value={capitalGains.ltcg.q1} onChange={(e) => handleCapitalChange('ltcg', 'q1', e.target.value)} />
            <InputField label="ii. 16-Jun to 15-Sep" name="ltcg_q2" value={capitalGains.ltcg.q2} onChange={(e) => handleCapitalChange('ltcg', 'q2', e.target.value)} />
            <InputField label="iii. 16-Sep to 15-Dec" name="ltcg_q3" value={capitalGains.ltcg.q3} onChange={(e) => handleCapitalChange('ltcg', 'q3', e.target.value)} />
            <InputField label="iv. 16-Dec to 15-Mar" name="ltcg_q4" value={capitalGains.ltcg.q4} onChange={(e) => handleCapitalChange('ltcg', 'q4', e.target.value)} />
            <InputField label="v. 16-Mar to 31-Mar" name="ltcg_q5" value={capitalGains.ltcg.q5} onChange={(e) => handleCapitalChange('ltcg', 'q5', e.target.value)} />
          </div>

          <div className="p-3 bg-[#121212] rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Total LTCG (112A): <span className="text-white font-bold text-lg">₹{totalLtcg.toLocaleString('en-IN')}</span></p>
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => navigate('/taxation/business')}
            className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors"
          >
            &larr; Back
          </button>
          <button 
            onClick={() => {
              if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
              else navigate('/taxation/adjustments');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            Save & Continue
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
