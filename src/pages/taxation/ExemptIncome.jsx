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

export default function ExemptIncome() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const { exemptIncome } = taxData;

  const handleChange = (e) => {
    updateTaxData('exemptIncome', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Exempt Income</h2>
        <p className="text-gray-400">Enter details of income that is completely exempt from tax.</p>
        <p className="text-blue-400 text-sm mt-2">Note: This income will be reported in the document but will NOT increase your taxable income.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            Exempt Sources
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField 
              label="Agricultural Income" 
              name="agriculture"
              value={exemptIncome.agriculture} 
              onChange={handleChange}
            />
            <InputField 
              label="PPF / EPF Interest" 
              name="ppfInterest"
              value={exemptIncome.ppfInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Insurance Maturity / Bonus" 
              name="insuranceMaturity"
              value={exemptIncome.insuranceMaturity} 
              onChange={handleChange}
            />
            <InputField 
              label="NPS / UPS Withdrawal" 
              name="npsWithdrawal"
              value={exemptIncome.npsWithdrawal} 
              onChange={handleChange}
            />
            <InputField 
              label="Provident Fund Maturity" 
              name="pfMaturity"
              value={exemptIncome.pfMaturity} 
              onChange={handleChange}
            />
            <InputField 
              label="Share from HUF" 
              name="hufShare"
              value={exemptIncome.hufShare} 
              onChange={handleChange}
            />
            <InputField 
              label="Sukanya Samriddhi Yojana (SSY)" 
              name="ssyMaturity"
              value={exemptIncome.ssyMaturity} 
              onChange={handleChange}
            />
            <InputField 
              label="Any Other Exempt Income" 
              name="otherExempt"
              value={exemptIncome.otherExempt} 
              onChange={handleChange}
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
            onClick={() => {
              if (taxData.incomes.hasDeductions) navigate('/taxation/deductions');
              else if (taxData.incomes.hasPrepaidTaxes) navigate('/taxation/taxes-paid');
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
