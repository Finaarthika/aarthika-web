import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, required }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder || ''}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
    />
  </div>
);

export default function BasicDetails() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Permanent Information To Prepare Your Tax Return</h1>
        <p className="text-[15px] text-gray-500 font-medium">We'll keep it a secret.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TaxInput 
            label="First Name" 
            value={taxData.clientDetails.firstName} 
            onChange={(e) => updateTaxData('clientDetails', 'firstName', e.target.value)} 
            required 
          />
          <TaxInput 
            label="Middle Name" 
            value={taxData.clientDetails.middleName} 
            onChange={(e) => updateTaxData('clientDetails', 'middleName', e.target.value)} 
          />
          <TaxInput 
            label="Last Name" 
            value={taxData.clientDetails.lastName} 
            onChange={(e) => updateTaxData('clientDetails', 'lastName', e.target.value)} 
            required 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TaxInput 
            label="Father's Name" 
            value={taxData.clientDetails.fatherName} 
            onChange={(e) => updateTaxData('clientDetails', 'fatherName', e.target.value)} 
            required 
          />
          <TaxInput 
            label="Mobile Number" 
            value={taxData.clientDetails.mobile} 
            onChange={(e) => updateTaxData('clientDetails', 'mobile', e.target.value)} 
            required 
          />
          <TaxInput 
            label="Email ID" 
            value={taxData.clientDetails.email} 
            onChange={(e) => updateTaxData('clientDetails', 'email', e.target.value)} 
            required 
          />
        </div>

        <div className="flex justify-center items-center gap-6 mb-6">
          <span className="text-[14px] font-semibold text-slate-700">Gender</span>
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'gender', 'Male')}>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.gender === 'Male' ? 'border-green-600' : 'border-gray-400'}`}>
              {taxData.clientDetails.gender === 'Male' && <div className="w-2 h-2 rounded-full bg-green-600" />}
            </div>
            <span className="text-[14px] text-slate-700">Male</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => updateTaxData('clientDetails', 'gender', 'Female')}>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${taxData.clientDetails.gender === 'Female' ? 'border-green-600' : 'border-gray-400'}`}>
              {taxData.clientDetails.gender === 'Female' && <div className="w-2 h-2 rounded-full bg-green-600" />}
            </div>
            <span className="text-[14px] text-slate-700">Female</span>
          </label>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-[13px] text-green-800 font-medium">Note #: Please enter above mentioned details as mentioned on your PAN Card</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate('/taxation/bank-accounts')}
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
            onClick={() => navigate('/taxation/basic-details-2')}
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
