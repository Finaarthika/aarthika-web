import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
    <span className="text-gray-200 font-medium">{label}</span>
    <div className="flex bg-[#1a1a1a] rounded-full p-1 border border-gray-800">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          value ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          !value ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        No
      </button>
    </div>
  </div>
);

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

  const handleGiftChange = (e) => {
    updateNestedTaxData('otherSources', 'gifts', e.target.name, Number(e.target.value));
  };

  const handleGiftToggle = (val) => {
    updateNestedTaxData('otherSources', 'gifts', 'isExemptOccasion', val);
  };

  const totalGifts = Number(otherSources.gifts.monetary) + Number(otherSources.gifts.movable) + Number(otherSources.gifts.immovable);
  const isGiftTaxable = !otherSources.gifts.isExemptOccasion && totalGifts > 50000;

  return (
    <div className="max-w-4xl mx-auto py-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Income from Other Sources</h2>
        <p className="text-gray-400">Enter details of interest, dividends, gifts and other miscellaneous incomes.</p>
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
              label="Saving Bank A/c" 
              name="savingsInterest"
              value={otherSources.savingsInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Fixed Deposit" 
              name="fdInterest"
              value={otherSources.fdInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Income Tax Refund" 
              name="taxRefundInterest"
              value={otherSources.taxRefundInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Bonds & Debentures" 
              name="bondsInterest"
              value={otherSources.bondsInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="EPF Interest" 
              name="epfInterest"
              value={otherSources.epfInterest} 
              onChange={handleChange}
            />
            <InputField 
              label="Loans & Advances" 
              name="loansInterest"
              value={otherSources.loansInterest} 
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
            <InputField label="i. Up to 15-Jun-2025" name="q1" value={otherSources.dividend.q1} onChange={handleDividendChange} />
            <InputField label="ii. 16-Jun to 15-Sep" name="q2" value={otherSources.dividend.q2} onChange={handleDividendChange} />
            <InputField label="iii. 16-Sep to 15-Dec" name="q3" value={otherSources.dividend.q3} onChange={handleDividendChange} />
            <InputField label="iv. 16-Dec to 15-Mar" name="q4" value={otherSources.dividend.q4} onChange={handleDividendChange} />
            <InputField label="v. 16-Mar to 31-Mar" name="q5" value={otherSources.dividend.q5} onChange={handleDividendChange} />
          </div>
        </div>

        {/* Gifts Section */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">3</span>
              Gifts Received
            </h3>
            <p className="text-sm text-gray-400 mt-1 ml-10">Gifts from non-relatives &gt; ₹50,000 are fully taxable unless received on a specific occasion.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <InputField label="Monetary Gifts" name="monetary" value={otherSources.gifts.monetary} onChange={handleGiftChange} />
            <InputField label="Movable Property" name="movable" value={otherSources.gifts.movable} onChange={handleGiftChange} />
            <InputField label="Immovable Property" name="immovable" value={otherSources.gifts.immovable} onChange={handleGiftChange} />
          </div>

          <div className="mb-6">
            <Toggle 
              label="Was this gift received on the occasion of marriage, under a will, or from a relative?" 
              value={otherSources.gifts.isExemptOccasion} 
              onChange={handleGiftToggle} 
            />
          </div>

          {otherSources.gifts.isExemptOccasion && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Occasion / Source Narration (e.g. "Marriage", "Will")
              </label>
              <input
                type="text"
                value={otherSources.gifts.exemptGiftNarration}
                onChange={(e) => updateNestedTaxData('otherSources', 'gifts', 'exemptGiftNarration', e.target.value)}
                placeholder="Enter occasion details..."
                className="w-full bg-[#121212] border border-gray-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          )}

          <div className="p-4 bg-[#121212] rounded-lg border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Total Gifts Received</p>
              <p className="text-xl font-bold text-white">₹{totalGifts.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Taxable Gift Amount</p>
              <p className={`text-xl font-bold ${isGiftTaxable ? 'text-red-400' : 'text-green-400'}`}>
                ₹{isGiftTaxable ? totalGifts.toLocaleString('en-IN') : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Miscellaneous */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">4</span>
            Miscellaneous Incomes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InputField 
                label="Family Pension" 
                name="familyPension"
                value={otherSources.familyPension} 
                onChange={handleChange}
                note="Standard deduction of 33.33% or ₹15,000 (whichever is lower) will be automatically applied."
              />
            </div>
            
            <div className="space-y-6">
              <InputField 
                label="Any Other Income (not reported above)" 
                name="anyOtherIncome"
                value={otherSources.anyOtherIncome} 
                onChange={handleChange}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Narration / Details
                </label>
                <input
                  type="text"
                  name="anyOtherIncomeNarration"
                  value={otherSources.anyOtherIncomeNarration || ''}
                onChange={(e) => updateTaxData('otherSources', 'anyOtherIncomeNarration', e.target.value)}
                placeholder="e.g. Freelance consulting"
                className="w-full bg-[#121212] border border-gray-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
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
