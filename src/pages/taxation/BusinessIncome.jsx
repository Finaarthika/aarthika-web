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
      <label className="text-[11px] text-gray-500 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2 text-gray-500 text-[14px]">{prefix}</span>}
        <input
          type={type}
          inputMode={prefix === '₹' ? 'numeric' : 'text'}
          name={name}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder || ''}
          className={`w-full border border-gray-300 rounded-[4px] py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${prefix ? 'pl-7 pr-3' : 'px-3'} ${uppercase ? 'uppercase' : ''}`}
        />
      </div>
      {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
    </div>
  );
};

const RadioCard = ({ title, desc, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 border rounded-lg cursor-pointer transition-all h-full ${selected ? 'border-green-600 bg-white shadow-[0_0_0_1px_#16a34a]' : 'border-gray-200 bg-white hover:border-green-400'}`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-[18px] h-[18px] mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${selected ? 'border-green-600' : 'border-gray-300'}`}>
        {selected && <div className="w-[10px] h-[10px] rounded-full bg-green-600" />}
      </div>
      <div>
        <h4 className={`text-[13px] font-bold ${selected ? 'text-slate-800' : 'text-slate-600'}`}>{title}</h4>
        <p className="text-[11px] text-gray-500 leading-snug mt-1">{desc}</p>
      </div>
    </div>
  </div>
);

export default function BusinessIncome() {
  const { taxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { business } = taxData;

  const setIncomeType = (type) => updateTaxData('business', 'businessIncomeType', type);
  const setScheme = (scheme) => updateTaxData('business', 'presumptiveType', scheme);

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">ENTER YOUR BUSINESS, PROFESSIONAL, FREELANCING INCOME DETAILS</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-[16px] text-slate-800">Business Income</h3>
        </div>

        <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 flex justify-between items-center mb-6">
          <span className="text-[14px] font-bold text-slate-800">Select Business Income Type</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIncomeType('presumptive')}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${business.businessIncomeType === 'presumptive' ? 'border-green-600' : 'border-gray-300'}`}>
                {business.businessIncomeType === 'presumptive' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
              </div>
              <span className={`text-[14px] font-bold ${business.businessIncomeType === 'presumptive' ? 'text-green-700' : 'text-slate-600'}`}>Presumptive Income</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIncomeType('normal')}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${business.businessIncomeType === 'normal' ? 'border-green-600' : 'border-gray-300'}`}>
                {business.businessIncomeType === 'normal' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
              </div>
              <span className={`text-[14px] font-bold ${business.businessIncomeType === 'normal' ? 'text-green-700' : 'text-slate-600'}`}>Normal Business Income</span>
            </label>
          </div>
        </div>

        {business.businessIncomeType === 'presumptive' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <RadioCard 
              title="Presumptive Scheme u/s 44AD" 
              desc="For businesses such as manufacturing, real estate, hospitality, retail, agriculture, milk etc."
              selected={business.presumptiveType === '44AD'}
              onClick={() => setScheme('44AD')}
            />
            <RadioCard 
              title="Presumptive Scheme u/s 44ADA" 
              desc="For professionals such as doctors, lawyers, designers, engineers, accountants, architects, freelancers etc."
              selected={business.presumptiveType === '44ADA'}
              onClick={() => setScheme('44ADA')}
            />
            <RadioCard 
              title="Presumptive Scheme u/s 44AE" 
              desc="For businesses including leasing, renting or transporting goods carriages."
              selected={business.presumptiveType === '44AE'}
              onClick={() => setScheme('44AE')}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">Business Category <span className="text-red-500">*</span></label>
            <select 
              value={business.businessCategory}
              onChange={(e) => updateTaxData('business', 'businessCategory', e.target.value)}
              className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              <option value="">Please Select</option>
              <option value="Wholesale & Retail">Wholesale & Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">Nature of Business <span className="text-red-500">*</span></label>
            <select 
              value={business.businessNatureCode}
              onChange={(e) => updateTaxData('business', 'businessNatureCode', e.target.value)}
              className="w-full border border-gray-300 rounded-[4px] px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              <option value="">Please Select</option>
              <option value="09005">Retail sale of other products</option>
              <option value="09001">Retail sale of garments</option>
            </select>
          </div>
          <TaxInput label="Name of the Business *" value={business.businessName} onChange={(e) => updateTaxData('business', 'businessName', e.target.value)} />
          <TaxInput label="Description (Optional)" value={business.businessDescription} onChange={(e) => updateTaxData('business', 'businessDescription', e.target.value)} />
        </div>

        <div className="mb-6">
          <h4 className="text-[14px] font-bold text-slate-800 mb-4">Turnover / Gross Receipt reported for GST</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TaxInput label="GSTIN" value={business.gstin} onChange={(e) => updateTaxData('business', 'gstin', e.target.value)} uppercase />
            <TaxInput label="Turnover / Gross receipt as per the GST return filed" value={business.gstTurnover} onChange={(e) => updateTaxData('business', 'gstTurnover', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button onClick={() => navigate('/taxation/business-trading-details')} className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2 px-6 rounded-full text-[13px] flex items-center gap-1.5 transition-colors">
            + Add Business Income
          </button>
        </div>
        
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-3 text-[12px] text-slate-600 text-center font-medium">
          <span className="font-bold text-slate-800">Note:</span> Income from trading (Intraday, Futures & Options, Currency, or Commodity), add it under the Capital Gains - '<span className="font-bold">Equity, Mutual Funds, Intraday, F&O, and More</span>' tab.
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate('/taxation/capital-gains')} className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => navigate('/taxation/business-trading-details')}
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
