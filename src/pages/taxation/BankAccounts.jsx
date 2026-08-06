import React, { useState } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, required = false, uppercase = false }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className={`border border-gray-300 rounded-md px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${uppercase ? 'uppercase' : ''}`}
    />
  </div>
);

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

const YesNoToggle = ({ value, onChange, recommended = false }) => (
  <div className="flex items-center gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${value ? 'border-green-600' : 'border-gray-400'}`}>
        {value && <div className="w-2 h-2 rounded-full bg-green-600" />}
      </div>
      <span className="text-[13px] font-semibold text-slate-700">Yes</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!value ? 'border-green-600' : 'border-gray-400'}`}>
        {!value && <div className="w-2 h-2 rounded-full bg-green-600" />}
      </div>
      <span className="text-[13px] font-semibold text-slate-700">No</span>
    </label>
  </div>
);

export default function BasicDetails() {
  const { taxData, updateTaxData, updateArrayData } = useTaxation();
  const navigate = useNavigate();
  const bankAccounts = taxData.bankAccounts || [];

  const [regime, setRegime] = useState('new');
  const [sameAddress, setSameAddress] = useState(true);

  const handleClientChange = (e) => {
    updateTaxData('clientDetails', e.target.name, e.target.value);
  };

  const handleAddAccount = () => {
    const newId = bankAccounts.length > 0 ? Math.max(...bankAccounts.map(a => a.id)) + 1 : 1;
    const newArray = [...bankAccounts, { id: newId, bankName: '', ifsc: '', accountNumber: '', type: 'Savings', isRefund: bankAccounts.length === 0 }];
    updateArrayData('bankAccounts', newArray);
  };

  const handleRemoveAccount = (id) => {
    const newArray = bankAccounts.filter(a => a.id !== id);
    if (newArray.length > 0 && !newArray.some(a => a.isRefund)) {
      newArray[0].isRefund = true;
    }
    updateArrayData('bankAccounts', newArray);
  };

  const handleChangeAccount = (id, field, value) => {
    const newArray = bankAccounts.map(account => {
      if (account.id === id) {
        return { ...account, [field]: value };
      }
      if (field === 'isRefund' && value === true) {
        return { ...account, isRefund: false };
      }
      return account;
    });
    updateArrayData('bankAccounts', newArray);
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Start Your Income Tax Return Filing</h1>
        <p className="text-[15px] text-gray-500 font-medium">Let us do the paperwork.</p>
      </div>

      {/* Financial Details Card */}
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
            required 
            uppercase
          />
          <TaxInput 
            label="First Name" 
            value={taxData.clientDetails.firstName} 
            onChange={(e) => updateTaxData('clientDetails', 'firstName', e.target.value)}
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
      </div>

      {/* Address Details Card */}
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
            <p className="text-[11px] font-bold text-green-600 mt-1">KISHANGANJ, BIHAR, India ✎</p>
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
          <span className="text-[14px] text-slate-700">Is your residential address same as your permanent address?</span>
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

        <div className="border-t border-gray-200 mt-6 pt-6">
          <div className="md:w-1/2">
            <TaxSelect 
              label="Employer Category" 
              required 
              options={[{value: 'private', label: 'Private / Others'}, {value: 'govt', label: 'Government'}]}
            />
          </div>
        </div>
      </div>

      {/* Bank Accounts Card */}
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Bank Accounts</h1>
        <p className="text-[15px] text-gray-500 font-medium">Add all active accounts, choose one for refund.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-6">
            <button onClick={handleAddAccount} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-slate-600 hover:border-green-600 hover:text-green-700 font-medium transition-colors">
              + Add Bank Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bankAccounts.map((account, index) => (
              <div key={account.id} className="border border-gray-200 rounded-xl p-6 relative">
                <button onClick={() => handleRemoveAccount(account.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold">✕</button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                   <TaxInput label="Bank Name" value={account.bankName} onChange={(e) => handleChangeAccount(account.id, 'bankName', e.target.value)} required />
                   <TaxInput label="IFSC Code" value={account.ifsc} onChange={(e) => handleChangeAccount(account.id, 'ifsc', e.target.value)} uppercase required />
                   <TaxInput label="Account Number" value={account.accountNumber} onChange={(e) => handleChangeAccount(account.id, 'accountNumber', e.target.value)} required />
                   <TaxSelect 
                    label="Account Type" 
                    value={account.type} 
                    onChange={(e) => handleChangeAccount(account.id, 'type', e.target.value)}
                    options={[{value:'Savings', label:'Savings'}, {value:'Current', label:'Current'}]}
                   />
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                   <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${account.isRefund ? 'border-green-600' : 'border-gray-400'}`}>
                      {account.isRefund && <div className="w-2 h-2 rounded-full bg-green-600" />}
                    </div>
                    <span className="text-[14px] font-semibold text-slate-700">Use this account for Income Tax Refund</span>
                  </label>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <button onClick={handleAddAccount} className="text-blue-600 font-semibold text-sm hover:underline">+ Add Another Account</button>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
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
            onClick={() => {
              const nextRoute = taxData.incomes.hasBusiness ? '/taxation/business' :
                                taxData.incomes.hasCapitalGains ? '/taxation/capital-gains' :
                                taxData.incomes.hasOtherSources ? '/taxation/other-sources' :
                                taxData.incomes.hasExemptIncome ? '/taxation/exempt-income' :
                                '/taxation/computation';
              navigate(nextRoute);
            }}
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
