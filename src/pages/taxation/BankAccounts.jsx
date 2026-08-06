import React, { useState } from 'react';
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


const TaxSelect = ({ label, value, onChange, options, required = false }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={onChange}
      className="border border-gray-300 rounded-md px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white"
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default function BankAccounts() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const [regime, setRegime] = useState('new');
  const [prefill, setPrefill] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Start Your Income Tax Return Filing</h1>
        <p className="text-[15px] text-gray-500 font-medium">Let us do the paperwork.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TaxSelect 
            label="Financial Year" 
            value={taxData.clientDetails.assessmentYear}
            onChange={(e) => updateTaxData('clientDetails', 'assessmentYear', e.target.value)}
            required 
            options={[{value: '2025-26', label: '2025-2026'}, {value: '2024-25', label: '2024-2025'}]}
          />
          <TaxInput 
            label="PAN Number" 
            value={taxData.clientDetails.pan} 
            onChange={(e) => updateTaxData('clientDetails', 'pan', e.target.value)}
            uppercase
          />
          <TaxInput 
            label="Date of Birth" 
            type="date"
            value={taxData.clientDetails.dob} 
            onChange={(e) => updateTaxData('clientDetails', 'dob', e.target.value)}
            required 
          />
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-50/50">
          <div>
            <h4 className="text-[15px] font-bold text-slate-800">Select Your Tax Regime <span className="text-green-600 font-normal italic text-[13px] ml-1">Learn More</span></h4>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRegime('new')}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${regime === 'new' ? 'border-green-600' : 'border-gray-400'}`}>
                {regime === 'new' && <div className="w-2 h-2 rounded-full bg-green-600" />}
              </div>
              <span className="text-[14px] font-semibold text-slate-700">New Regime <span className="text-green-600 italic text-[12px] font-normal">(Recommended)</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRegime('old')}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${regime === 'old' ? 'border-green-600' : 'border-gray-400'}`}>
                {regime === 'old' && <div className="w-2 h-2 rounded-full bg-green-600" />}
              </div>
              <span className="text-[14px] font-semibold text-slate-700">Old Regime</span>
            </label>
          </div>
        </div>

        <div className="border border-green-100 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center bg-green-50/30">
          <div>
            <h4 className="text-[15px] font-bold text-slate-800">Pre-Fill Your ITR in Seconds <span className="text-green-600 font-normal italic text-[13px] ml-1">(Recommended)</span></h4>
            <p className="text-[12px] text-gray-500 mt-1">Auto Fetch Income Details from the Income Tax Department. Quick, Hassle Free, Saves Time and Reduces Errors.</p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 whitespace-nowrap">
            <span className="text-[14px] font-semibold text-slate-700 mr-2">Do you want to Pre-Fill data?</span>
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPrefill(true)}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${prefill ? 'border-green-600' : 'border-gray-400'}`}>
                {prefill && <div className="w-2 h-2 rounded-full bg-green-600" />}
              </div>
              <span className="text-[14px] font-semibold text-slate-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPrefill(false)}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!prefill ? 'border-green-600' : 'border-gray-400'}`}>
                {!prefill && <div className="w-2 h-2 rounded-full bg-green-600" />}
              </div>
              <span className="text-[14px] font-semibold text-slate-700">No</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate('/taxation')} className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => navigate('/taxation/basic-details')}
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
