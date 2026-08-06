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


const TaxSelect = ({ label, value, onChange, required, options }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <select
      value={value || ''}
      onChange={onChange}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-white"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

export default function BasicDetails2() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const [sameAddress, setSameAddress] = useState(true);

  const [pincodeDetails, setPincodeDetails] = useState('');

  React.useEffect(() => {
    const pin = taxData.clientDetails.pincode;
    if (pin && pin.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const po = data[0].PostOffice[0];
            setPincodeDetails(`${po.District.toUpperCase()}, ${po.State.toUpperCase()}, India ✔`);
          } else {
            setPincodeDetails('Invalid Pincode ❌');
          }
        })
        .catch(() => setPincodeDetails(''));
    } else {
      setPincodeDetails('');
    }
  }, [taxData.clientDetails.pincode]);

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Address Details</h1>
        <p className="text-[15px] text-gray-500 font-medium">We'll keep it a secret.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Permanent Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="col-span-1 md:col-span-2 md:w-1/2">
            <TaxInput 
              label="Pincode" 
              value={taxData.clientDetails.pincode} 
              onChange={(e) => updateTaxData('clientDetails', 'pincode', e.target.value)} 
              required 
            />
            {pincodeDetails && (
              <p className={`text-[11px] font-bold mt-1 ${pincodeDetails.includes('Invalid') ? 'text-red-600' : 'text-green-600'}`}>
                {pincodeDetails}
              </p>
            )}
          </div>
          <TaxInput 
            label="Flat / Door / Building" 
            value={taxData.clientDetails.flatDoor} 
            onChange={(e) => updateTaxData('clientDetails', 'flatDoor', e.target.value)} 
            required 
          />
          <TaxInput 
            label="Building / Village" 
            value={taxData.clientDetails.building} 
            onChange={(e) => updateTaxData('clientDetails', 'building', e.target.value)} 
          />
          <TaxInput 
            label="Road" 
            value={taxData.clientDetails.road} 
            onChange={(e) => updateTaxData('clientDetails', 'road', e.target.value)} 
          />
          <TaxInput 
            label="Area" 
            value={taxData.clientDetails.area} 
            onChange={(e) => updateTaxData('clientDetails', 'area', e.target.value)} 
            required 
          />
        </div>
        
        <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
          <span className="text-[14px] font-semibold text-slate-700">Is your residential address same as your permanent address?</span>
          <div className="flex gap-3">
            <button 
              onClick={() => setSameAddress(true)}
              className={`px-6 py-1.5 rounded-full text-sm font-semibold ${sameAddress ? 'bg-[#1b7a43] text-white' : 'border border-gray-300 text-slate-600 hover:bg-gray-50'}`}
            >Yes</button>
            <button 
              onClick={() => setSameAddress(false)}
              className={`px-6 py-1.5 rounded-full text-sm font-semibold ${!sameAddress ? 'bg-[#1b7a43] text-white' : 'border border-gray-300 text-slate-600 hover:bg-gray-50'}`}
            >No</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Employer Category</h3>
        <div className="w-1/2">
          <TaxSelect 
            label="Employer Category" 
            value={taxData.clientDetails.employerCategory || 'private'} 
            onChange={(e) => updateTaxData('clientDetails', 'employerCategory', e.target.value)} 
            required
            options={[
              {value: 'government', label: 'Government'},
              {value: 'psu', label: 'PSU'},
              {value: 'pensioner', label: 'Pensioner - Govt'},
              {value: 'private', label: 'Private / Others'},
              {value: 'na', label: 'Not Applicable'},
            ]}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate('/taxation/basic-details')}
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
            onClick={() => navigate('/taxation/capital-gains')}
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
