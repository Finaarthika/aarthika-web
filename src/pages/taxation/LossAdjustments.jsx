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
        value={value === 0 ? '' : value}
        onChange={onChange}
        placeholder="0"
        className={`w-full bg-[#121212] border border-gray-800 rounded-lg py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${prefix ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
    {note && <p className="text-xs text-gray-500 mt-2">{note}</p>}
  </div>
);

export default function LossAdjustments() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const { bfla } = taxData;

  const handleChange = (e) => {
    updateTaxData('bfla', e.target.name, Number(e.target.value));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Loss Adjustments</h2>
        <p className="text-gray-400">Enter Brought Forward Losses (BFLA) to be set off against current year's income.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            Brought Forward Losses
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <InputField 
              label="Brought Forward Business Loss" 
              name="businessLoss"
              value={bfla.businessLoss} 
              onChange={handleChange}
              note="Can only be set off against Business Income"
            />
            <InputField 
              label="Brought Forward Short-Term Capital Loss (STCL)" 
              name="stcgLoss"
              value={bfla.stcgLoss} 
              onChange={handleChange}
              note="Can be set off against STCG and LTCG"
            />
            <InputField 
              label="Brought Forward Long-Term Capital Loss (LTCL)" 
              name="ltcgLoss"
              value={bfla.ltcgLoss} 
              onChange={handleChange}
              note="Can only be set off against LTCG"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => {
              if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
              else if (taxData.incomes.hasCapitalGains) navigate('/taxation/capital-gains');
              else if (taxData.incomes.hasBusiness) navigate('/taxation/business');
              else navigate('/taxation');
            }}
            className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors"
          >
            &larr; Back
          </button>
          <button 
            onClick={() => navigate('/taxation/computation')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            Go to Computation
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
