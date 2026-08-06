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


export default function Deductions() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const { deductions } = taxData;

  const handleChange = (e) => {
    updateTaxData('deductions', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Chapter VI-A Deductions</h1>
        <p className="text-[15px] text-gray-500 font-medium">Claim eligible deductions under the New Tax Regime</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-lg text-slate-800">Applicable Deductions</h3>
        </div>
        <p className="text-[13px] text-gray-500 mb-6 border-l-4 border-blue-400 pl-3 bg-blue-50 py-2 w-max">
          <span className="font-bold text-slate-700">Note:</span> Under the New Tax Regime, only specific deductions like Section 80CCD(2) and Section 80CCH are allowed.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TaxInput 
            label="Sec 80CCD(2) - Employer's NPS Contribution" 
            name="sec80CCD2"
            value={deductions.sec80CCD2} 
            onChange={handleChange}
            note="Exempt up to 10% (14% for Govt) of Salary"
            prefix="₹"
          />
          <TaxInput 
            label="Sec 80CCH - Agniveer Corpus Fund" 
            name="sec80CCH"
            value={deductions.sec80CCH} 
            onChange={handleChange}
            prefix="₹"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate('/taxation/exempt-income')}
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
            onClick={() => navigate('/taxation/bank-details')}
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
