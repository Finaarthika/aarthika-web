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

export default function BankDetails() {
  const { taxData, updateArrayData, setTaxData } = useTaxation();
  const navigate = useNavigate();
  const bankAccounts = taxData.bankAccounts || [];

  const handleAddBank = () => {
    const newId = bankAccounts.length > 0 ? Math.max(...bankAccounts.map(b => b.id)) + 1 : 1;
    updateArrayData('bankAccounts', [
      ...bankAccounts,
      { id: newId, bankName: '', ifsc: '', accountNumber: '', type: 'Savings', isRefund: false }
    ]);
  };

  const handleRemoveBank = (id) => {
    updateArrayData('bankAccounts', bankAccounts.filter(b => b.id !== id));
  };

  const handleBankChange = (id, field, value) => {
    updateArrayData('bankAccounts', bankAccounts.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    ));
    
    if (field === 'ifsc' && value.length === 11) {
       fetch(`https://ifsc.razorpay.com/${value}`)
         .then(res => res.json())
         .then(data => {
            if (data && data.BANK) {
               setTaxData(prev => ({
                 ...prev,
                 bankAccounts: prev.bankAccounts.map(b => b.id === id ? { ...b, bankName: data.BANK } : b)
               }));
            }
         }).catch(err => console.error('Invalid IFSC'));
    }
  };

  const handleRefundToggle = (id) => {
    updateArrayData('bankAccounts', bankAccounts.map(b =>
      b.id === id ? { ...b, isRefund: true } : { ...b, isRefund: false }
    ));
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Bank Account Details</h1>
        <p className="text-[15px] text-gray-500 font-medium">Add your bank accounts for tax refund and verification</p>
      </div>

      <div className="space-y-6 mb-8">
        {bankAccounts.map((bank, index) => (
          <div key={bank.id} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Bank Account {index + 1}</h3>
              <div className="flex items-center gap-4">
                <label 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleRefundToggle(bank.id)}
                >
                  <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${bank.isRefund ? 'bg-green-600 border-green-600' : 'border-gray-400'}`}>
                    {bank.isRefund && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-[13px] text-green-700 font-semibold">Refund Account</span>
                </label>
                {bankAccounts.length > 1 && (
                  <button 
                    onClick={() => handleRemoveBank(bank.id)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >✕ Remove</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TaxInput 
                label="Bank Name" 
                value={bank.bankName} 
                onChange={(e) => handleBankChange(bank.id, 'bankName', e.target.value)} 
                required 
              />
              <TaxInput 
                label="IFSC Code" 
                value={bank.ifsc} 
                onChange={(e) => handleBankChange(bank.id, 'ifsc', e.target.value.toUpperCase())} 
                required 
              />
              <TaxInput 
                label="Account Number" 
                value={bank.accountNumber} 
                onChange={(e) => handleBankChange(bank.id, 'accountNumber', e.target.value)} 
                required 
              />
            </div>
            <div className="mt-4 w-1/3">
              <TaxSelect 
                label="Account Type" 
                value={bank.type} 
                onChange={(e) => handleBankChange(bank.id, 'type', e.target.value)}
                options={[
                  {value: 'Savings', label: 'Savings'},
                  {value: 'Current', label: 'Current'},
                ]}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mb-8">
        <button 
          onClick={handleAddBank}
          className="px-6 py-2.5 border border-dashed border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
        >
          + Add Another Bank Account
        </button>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => navigate('/taxation/deductions')}
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
            onClick={() => navigate('/taxation/taxes-paid')}
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
