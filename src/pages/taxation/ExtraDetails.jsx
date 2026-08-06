import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, prefix, note, required, uppercase, type = "text", name }) => {
  const formatVal = (v) => {
    if (v === null || v === undefined || v === '') return '';
    if (prefix === '₹') {
      let str = String(v).replace(/[^0-9.]/g, '');
      if (!str) return '';
      let parts = str.split('.');
      let intPart = parts[0];
      if (intPart.length > 3) {
        let lastThree = intPart.substring(intPart.length - 3);
        let otherNumbers = intPart.substring(0, intPart.length - 3);
        intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ',' + lastThree;
      }
      return parts.length > 1 ? intPart + '.' + parts[1] : intPart;
    }
    return String(v);
  };

  const [localValue, setLocalValue] = React.useState(formatVal(value));

  React.useEffect(() => {
    if (Number.isNaN(value) || typeof value === 'object') return;
    const cleanValue = prefix === '₹' ? String(value).replace(/[^0-9.]/g, '') : String(value);
    const cleanLocal = prefix === '₹' ? String(localValue).replace(/[^0-9.]/g, '') : String(localValue);
    
    if (cleanValue !== cleanLocal && String(value) !== cleanLocal) {
      setLocalValue(formatVal(value));
    }
  }, [value, prefix]);

  const handleChange = (e) => {
    let val = e.target.value;
    if (uppercase) val = val.toUpperCase();
    
    if (prefix === '₹') {
       val = val.replace(/[^0-9.]/g, '');
       if ((val.match(/\./g) || []).length > 1) return; 
       
       setLocalValue(formatVal(val));
       
       if (onChange) {
           e.target.value = val;
           if (name) e.target.name = name;
           onChange(e);
       }
    } else {
       setLocalValue(val);
       if (onChange) {
           e.target.value = val;
           if (name) e.target.name = name;
           onChange(e);
       }
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {note && (
          <div className="w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center text-[9px] font-bold cursor-help" title={note}>
            i
          </div>
        )}
      </label>
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
    </div>
  );
};

export default function ExtraDetails() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Extra Details</h1>
        <p className="text-[15px] text-gray-500 font-medium">Additional information for your tax return</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-lg text-slate-800">Aadhaar & Verification</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TaxInput 
            label="Aadhaar Number" 
            value={taxData.clientDetails.aadhaar} 
            onChange={(e) => updateTaxData('clientDetails', 'aadhaar', e.target.value)} 
          />
          <TaxInput 
            label="Aadhaar Enrollment ID (if no Aadhaar)" 
            value={taxData.clientDetails.aadhaarEnrollment} 
            onChange={(e) => updateTaxData('clientDetails', 'aadhaarEnrollment', e.target.value)} 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">2</div>
          <h3 className="font-bold text-lg text-slate-800">Additional Disclosures</h3>
        </div>

        <div className="space-y-4 text-[14px] text-slate-700">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span>Do you hold any foreign assets or have signing authority in a foreign account?</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'foreignAssets', true)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.foreignAssets ? 'border-green-600' : 'border-gray-400'}`}>
                  {taxData.clientDetails.foreignAssets && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </div>
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'foreignAssets', false)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.foreignAssets === false ? 'border-green-600' : 'border-gray-400'}`}>
                  {(taxData.clientDetails.foreignAssets === false || taxData.clientDetails.foreignAssets === undefined) && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </div>
                <span>No</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span>Are you a director of any company?</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'isDirector', true)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.isDirector ? 'border-green-600' : 'border-gray-400'}`}>
                  {taxData.clientDetails.isDirector && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </div>
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'isDirector', false)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.isDirector === false ? 'border-green-600' : 'border-gray-400'}`}>
                  {(taxData.clientDetails.isDirector === false || taxData.clientDetails.isDirector === undefined) && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </div>
                <span>No</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between items-center py-3">
            <span>Do you hold unlisted shares of a company at any time during the year?</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'unlistedShares', true)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.unlistedShares ? 'border-green-600' : 'border-gray-400'}`}>
                  {taxData.clientDetails.unlistedShares && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </div>
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'unlistedShares', false)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.unlistedShares === false ? 'border-green-600' : 'border-gray-400'}`}>
                  {(taxData.clientDetails.unlistedShares === false || taxData.clientDetails.unlistedShares === undefined) && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </div>
                <span>No</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate('/taxation/adjustments')}
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
            onClick={() => navigate('/taxation/computation')}
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
