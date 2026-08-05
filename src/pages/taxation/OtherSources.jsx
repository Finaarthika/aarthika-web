import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const InputField = ({ label, value, onChange, name, type = "number", prefix = "₹" }) => (
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
  </div>
);

export default function OtherSources() {
  const { taxData, updateTaxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { otherSources } = taxData;

  const handleChange = (e) => {
    updateTaxData('otherSources', e.target.name, Number(e.target.value));
  };

  const handleDividendChange = (e) => {
    updateNestedTaxData('otherSources', 'dividend', e.target.name, Number(e.target.value));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Income from Other Sources</h2>
        <p className="text-gray-400">Enter details of interest, dividends, and other miscellaneous incomes.</p>
      </div>

      <div className="space-y-8">
        {/* Interests Section */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            Earning Income from Interests
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField 
              label="Interest from Saving Bank A/c" 
              name="savingsInterest"
              value={otherSources.savingsInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Interest from Fixed Deposit" 
              name="fdInterest"
              value={otherSources.fdInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Interest from Income Tax Refund" 
              name="taxRefundInterest"
              value={otherSources.taxRefundInterest} 
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Dividend Section with Quarterly Breakup */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="mb-6">
             <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">2</span>
              Dividend Income
            </h3>
            <p className="text-sm text-gray-400 mt-1 ml-10">Please provide Quarterly breakup of Dividend Income (required for accurate Advance Tax accrual)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField 
              label="i. Up to 15-Jun-2025" 
              name="q1"
              value={otherSources.dividend.q1} 
              onChange={handleDividendChange}
            />
            <InputField 
              label="ii. From 16-Jun-2025 to 15-Sep-2025" 
              name="q2"
              value={otherSources.dividend.q2} 
              onChange={handleDividendChange}
            />
            <InputField 
              label="iii. From 16-Sep-2025 to 15-Dec-2025" 
              name="q3"
              value={otherSources.dividend.q3} 
              onChange={handleDividendChange}
            />
            <InputField 
              label="iv. From 16-Dec-2025 to 15-Mar-2026" 
              name="q4"
              value={otherSources.dividend.q4} 
              onChange={handleDividendChange}
            />
            <InputField 
              label="v. From 16-Mar-2026 to 31-Mar-2026" 
              name="q5"
              value={otherSources.dividend.q5} 
              onChange={handleDividendChange}
            />
          </div>
        </div>

        {/* Miscellaneous */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">3</span>
            Miscellaneous Incomes
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <InputField 
              label="Any Other Income (Gifts, etc.)" 
              name="anyOtherIncome"
              value={otherSources.anyOtherIncome} 
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => {
              if (taxData.incomes.hasCapitalGains) navigate('/taxation/capital-gains');
              else if (taxData.incomes.hasBusiness) navigate('/taxation/business');
              else navigate('/taxation');
            }}
            className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors"
          >
            &larr; Back
          </button>
          <button 
            onClick={() => {
              if (taxData.incomes.hasExemptIncome) navigate('/taxation/exempt-income');
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
