import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

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

export default function TaxesPaid() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const { prepaidTaxes } = taxData;

  const handleChange = (e) => {
    updateTaxData('prepaidTaxes', e.target.name, Number(e.target.value));
  };

  const totalPrepaid = Number(prepaidTaxes.advanceTax) + Number(prepaidTaxes.tdsSalary) + Number(prepaidTaxes.tdsOther) + Number(prepaidTaxes.tcs);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Prepaid Taxes</h2>
        <p className="text-gray-400">Enter details of Advance Tax, TDS, and TCS already paid or deducted.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            Taxes Deducted / Paid
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <InputField 
              label="Advance Tax Paid" 
              name="advanceTax"
              value={prepaidTaxes.advanceTax} 
              onChange={handleChange}
            />
            <InputField 
              label="TDS on Salary" 
              name="tdsSalary"
              value={prepaidTaxes.tdsSalary} 
              onChange={handleChange}
            />
            <InputField 
              label="TDS on Other Income" 
              name="tdsOther"
              value={prepaidTaxes.tdsOther} 
              onChange={handleChange}
            />
            <InputField 
              label="TCS (Tax Collected at Source)" 
              name="tcs"
              value={prepaidTaxes.tcs} 
              onChange={handleChange}
            />
          </div>

          <div className="p-4 bg-[#121212] rounded-lg border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Total Taxes Prepaid</p>
              <p className="text-xl font-bold text-green-400">₹{totalPrepaid.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors"
          >
            &larr; Back
          </button>
          <button 
            onClick={() => navigate('/taxation/adjustments')}
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
