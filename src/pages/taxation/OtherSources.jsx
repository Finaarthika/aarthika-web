import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, prefix, note, required, uppercase, type = "text", name }) => {
  const [localValue, setLocalValue] = React.useState(value === 0 || value === null || value === undefined ? '' : value);
  React.useEffect(() => {
    if (Number.isNaN(value) || typeof value === 'object') return;
    if (String(value) !== String(localValue) && value !== Number(localValue)) {
      setLocalValue(value === 0 || value === null || value === undefined ? '' : value);
    }
  }, [value]);
  const handleChange = (e) => {
    let val = e.target.value;
    if (uppercase) val = val.toUpperCase();
    if (prefix === '₹') {
       val = val.replace(/[^0-9.]/g, '');
       if ((val.match(/\./g) || []).length > 1) return;
    }
    setLocalValue(val);
    if (onChange) {
       e.target.value = val;
       if (name) e.target.name = name;
       onChange(e);
    }
  };
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2 text-gray-500 text-[14px]">{prefix}</span>}
        <input
          type={type}
          inputMode={prefix === '₹' ? 'numeric' : 'text'}
          name={name}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder || ''}
          className={`w-full border border-gray-300 rounded-md py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${prefix ? 'pl-7 pr-3' : 'px-3'} ${uppercase ? 'uppercase' : ''}`}
        />
      </div>
      {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
    </div>
  );
};


const TaxInputText = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
    />
  </div>
);

const YesNoToggle = ({ value, onChange, label }) => (
  <div className="flex flex-col mb-6">
    <span className="text-[14px] text-slate-700 mb-3">{label}</span>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(true)}>
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${value ? 'border-green-600' : 'border-gray-400'}`}>
          {value && <div className="w-2 h-2 rounded-full bg-green-600" />}
        </div>
        <span className="text-[14px] font-semibold text-slate-700">Yes</span>
        <input type="radio" className="hidden" checked={value} readOnly />
      </label>
      <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(false)}>
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!value ? 'border-green-600' : 'border-gray-400'}`}>
          {!value && <div className="w-2 h-2 rounded-full bg-green-600" />}
        </div>
        <span className="text-[14px] font-semibold text-slate-700">No</span>
        <input type="radio" className="hidden" checked={!value} readOnly />
      </label>
    </div>
  </div>
);

export default function OtherSources() {
  const { taxData, updateTaxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { otherSources } = taxData;

  const handleChange = (e) => {
    updateTaxData('otherSources', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
  };

  const handleDividendChange = (e) => {
    updateNestedTaxData('otherSources', 'dividend', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
  };

  const handleGiftChange = (e) => {
    updateNestedTaxData('otherSources', 'gifts', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
  };

  const handleGiftToggle = (val) => {
    updateNestedTaxData('otherSources', 'gifts', 'isExemptOccasion', val);
  };

  const totalGifts = Number(otherSources.gifts.monetary) + Number(otherSources.gifts.movable) + Number(otherSources.gifts.immovable);
  const isGiftTaxable = !otherSources.gifts.isExemptOccasion && totalGifts > 50000;

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Income From Other Sources</h1>
        <p className="text-[15px] text-gray-500 font-medium">Interest, Dividends, Gifts, and Family Pension</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-lg text-slate-800">Interest Income</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaxInput label="Savings Account" value={otherSources.savingsInterest} onChange={(e) => updateTaxData('otherSources', 'savingsInterest', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="Fixed / Recurring Deposits" value={otherSources.fdInterest} onChange={(e) => updateTaxData('otherSources', 'fdInterest', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="Income Tax Refund" value={otherSources.taxRefundInterest} onChange={(e) => updateTaxData('otherSources', 'taxRefundInterest', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="Bonds & Debentures" value={otherSources.bondsInterest} onChange={(e) => updateTaxData('otherSources', 'bondsInterest', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="EPF Interest" value={otherSources.epfInterest} onChange={(e) => updateTaxData('otherSources', 'epfInterest', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="Loans & Advances" value={otherSources.loansInterest} onChange={(e) => updateTaxData('otherSources', 'loansInterest', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">2</div>
          <h3 className="font-bold text-lg text-slate-800">Dividend Income</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">Please provide Quarterly breakup of Dividend Income (required for accurate Advance Tax accrual)</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaxInput label="i. Up to 15-Jun-2025" value={otherSources.dividend.q1} onChange={(e) => updateNestedTaxData('otherSources', 'dividend', 'q1', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="ii. 16-Jun to 15-Sep" value={otherSources.dividend.q2} onChange={(e) => updateNestedTaxData('otherSources', 'dividend', 'q2', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="iii. 16-Sep to 15-Dec" value={otherSources.dividend.q3} onChange={(e) => updateNestedTaxData('otherSources', 'dividend', 'q3', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="iv. 16-Dec to 15-Mar" value={otherSources.dividend.q4} onChange={(e) => updateNestedTaxData('otherSources', 'dividend', 'q4', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="v. 16-Mar to 31-Mar" value={otherSources.dividend.q5} onChange={(e) => updateNestedTaxData('otherSources', 'dividend', 'q5', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">3</div>
          <h3 className="font-bold text-lg text-slate-800">Gifts Received</h3>
        </div>
        <p className="text-[13px] text-gray-500 mb-6 border-l-4 border-yellow-400 pl-3 bg-yellow-50 py-2 w-max">
          <span className="font-bold text-slate-700">Note:</span> Gifts from non-relatives &gt; ₹50,000 are fully taxable unless received on a specific occasion.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TaxInput label="Monetary Gifts" value={otherSources.gifts.monetary} onChange={(e) => updateNestedTaxData('otherSources', 'gifts', 'monetary', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="Movable Property" value={otherSources.gifts.movable} onChange={(e) => updateNestedTaxData('otherSources', 'gifts', 'movable', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
          <TaxInput label="Immovable Property" value={otherSources.gifts.immovable} onChange={(e) => updateNestedTaxData('otherSources', 'gifts', 'immovable', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <YesNoToggle 
            label="Was this gift received on the occasion of marriage, under a will, or from a relative?" 
            value={otherSources.gifts.isExemptOccasion} 
            onChange={handleGiftToggle} 
          />
          
          {otherSources.gifts.isExemptOccasion && (
            <div className="w-1/2 mb-6">
              <TaxInputText 
                label="Occasion / Source Narration (e.g. Marriage, Will)" 
                value={otherSources.gifts.exemptGiftNarration} 
                onChange={(e) => updateNestedTaxData('otherSources', 'gifts', 'exemptGiftNarration', e.target.value)}
                placeholder="Enter occasion details..."
              />
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
            <span className="text-gray-600 font-medium text-[15px]">Total Gifts Received: <span className="text-slate-800 font-bold ml-2">₹{totalGifts.toLocaleString('en-IN')}</span></span>
            <span className="text-gray-600 font-medium text-[15px]">Taxable Gift Amount: <span className={`font-bold ml-2 ${isGiftTaxable ? 'text-red-600' : 'text-green-600'}`}>₹{isGiftTaxable ? totalGifts.toLocaleString('en-IN') : '0'}</span></span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">4</div>
          <h3 className="font-bold text-lg text-slate-800">Miscellaneous Incomes</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <TaxInput 
              label="Family Pension" 
              value={otherSources.familyPension} 
              onChange={(e) => updateTaxData('otherSources', 'familyPension', e.target.value === '' ? '' : Number(e.target.value))} 
              prefix="₹" 
              note="Standard deduction of 33.33% or ₹15,000 (whichever is lower) will be automatically applied."
            />
          </div>
          <div className="space-y-4">
            <TaxInput 
              label="Any Other Income (not reported above)" 
              value={otherSources.anyOtherIncome} 
              onChange={(e) => updateTaxData('otherSources', 'anyOtherIncome', e.target.value === '' ? '' : Number(e.target.value))} 
              prefix="₹" 
            />
            <TaxInputText 
              label="Narration / Details" 
              value={otherSources.anyOtherIncomeNarration || ''} 
              onChange={(e) => updateTaxData('otherSources', 'anyOtherIncomeNarration', e.target.value)} 
              placeholder="e.g. Freelance consulting"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate('/taxation/business')}
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
            onClick={() => navigate('/taxation/exempt-income')}
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
