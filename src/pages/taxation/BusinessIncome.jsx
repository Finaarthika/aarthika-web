import React, { useState, useEffect } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
    <span className="text-gray-200 font-medium">{label}</span>
    <div className="flex bg-[#1a1a1a] rounded-full p-1 border border-gray-800">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          value ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          !value ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        No
      </button>
    </div>
  </div>
);

const InputField = ({ label, value, onChange, type = "number", prefix = "₹", requiredMsg }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
      {label}
      {requiredMsg && <span className="text-red-400 text-xs">{requiredMsg}</span>}
    </label>
    <div className="relative">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-500 font-medium">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full bg-[#121212] border border-gray-800 rounded-lg py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${prefix ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
  </div>
);

export default function BusinessIncome() {
  const { taxData, updateTaxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { business } = taxData;
  const { balanceSheet } = business;

  const handleBusinessChange = (e) => {
    updateTaxData('business', e.target.name, e.target.type === 'number' ? Number(e.target.value) : e.target.value);
  };

  const handleBalanceSheetChange = (e) => {
    updateNestedTaxData('business', 'balanceSheet', e.target.name, Number(e.target.value));
  };

  // Auto-calculate minimum profits
  const minBankProfit = Math.ceil(business.turnoverBank * 0.06);
  const minCashProfit = Math.ceil(business.turnoverCash * 0.08);

  const bankProfitError = business.profitBank < minBankProfit && business.turnoverBank > 0 
    ? `Min 6% required: ₹${minBankProfit}` 
    : null;
    
  const cashProfitError = business.profitCash < minCashProfit && business.turnoverCash > 0
    ? `Min 8% required: ₹${minCashProfit}`
    : null;

  const totalTurnover = Number(business.turnoverBank) + Number(business.turnoverCash);
  const totalProfit = Number(business.profitBank) + Number(business.profitCash);
  const profitPercentage = totalTurnover > 0 ? ((totalProfit / totalTurnover) * 100).toFixed(2) : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Business & Profession (44AD)</h2>
        <p className="text-gray-400">Provide details for presumptive taxation under Section 44AD.</p>
      </div>

      <div className="space-y-8">
        {/* Basic Details */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            Basic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="col-span-1 md:col-span-2">
              <Toggle 
                label="Is the business registered under GST?" 
                value={business.isRegisteredGST} 
                onChange={(val) => updateTaxData('business', 'isRegisteredGST', val)} 
              />
            </div>
            {business.isRegisteredGST && (
              <InputField 
                label="GSTIN" 
                type="text" 
                prefix=""
                value={business.gstin} 
                onChange={(e) => updateTaxData('business', 'gstin', e.target.value)} 
              />
            )}
            <div className="col-span-1 md:col-span-2">
              <InputField 
                label="Name of Business" 
                type="text" 
                prefix=""
                value={business.businessName} 
                onChange={(e) => updateTaxData('business', 'businessName', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Turnover & Profit */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">2</span>
            Gross Receipts & Profit
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-300 pb-2 border-b border-gray-800">Digital / Bank Mode</h4>
              <InputField 
                label="Gross Receipts (Bank)" 
                value={business.turnoverBank} 
                onChange={(e) => updateTaxData('business', 'turnoverBank', Number(e.target.value))} 
              />
              <InputField 
                label="Declared Profit (Bank)" 
                value={business.profitBank} 
                onChange={(e) => updateTaxData('business', 'profitBank', Number(e.target.value))} 
                requiredMsg={bankProfitError}
              />
            </div>
            
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-300 pb-2 border-b border-gray-800">Cash / Other Mode</h4>
              <InputField 
                label="Gross Receipts (Cash)" 
                value={business.turnoverCash} 
                onChange={(e) => updateTaxData('business', 'turnoverCash', Number(e.target.value))} 
              />
              <InputField 
                label="Declared Profit (Cash)" 
                value={business.profitCash} 
                onChange={(e) => updateTaxData('business', 'profitCash', Number(e.target.value))} 
                requiredMsg={cashProfitError}
              />
            </div>
          </div>

          <div className="mt-8 p-4 bg-[#121212] rounded-lg border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Total Turnover</p>
              <p className="text-xl font-bold text-white">₹{totalTurnover.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Total Profit ({profitPercentage}%)</p>
              <p className={`text-xl font-bold ${bankProfitError || cashProfitError ? 'text-red-400' : 'text-green-400'}`}>
                ₹{totalProfit.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Sheet Items */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <div className="mb-6 flex justify-between items-end">
             <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">3</span>
              Balance Sheet Items
            </h3>
            <p className="text-sm text-gray-500">As of 31st March 2026</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 pb-2 mb-4 border-b border-gray-800">Sources of Funds</h4>
              <div className="space-y-4">
                <InputField label="Proprietor's Capital" value={balanceSheet.proprietorCapital} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'proprietorCapital', Number(e.target.value))} />
                <InputField label="Reserves & Surplus" value={balanceSheet.reservesAndSurplus} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'reservesAndSurplus', Number(e.target.value))} />
                <InputField label="Sundry Creditors" value={balanceSheet.sundryCreditors} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'sundryCreditors', Number(e.target.value))} />
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 pb-2 mb-4 border-b border-gray-800">Application of Funds</h4>
              <div className="space-y-4">
                <InputField label="Fixed Assets / Inventory" value={balanceSheet.inventory} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'inventory', Number(e.target.value))} />
                <InputField label="Sundry Debtors" value={balanceSheet.sundryDebtors} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'sundryDebtors', Number(e.target.value))} />
                <InputField label="Cash Balance" value={balanceSheet.cashBalance} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'cashBalance', Number(e.target.value))} />
                <InputField label="Bank Balance" value={balanceSheet.bankBalance} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'bankBalance', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => navigate('/taxation')}
            className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors"
          >
            &larr; Back
          </button>
          <button 
            onClick={() => {
              if (taxData.incomes.hasCapitalGains) navigate('/taxation/capital-gains');
              else if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
              else navigate('/taxation/adjustments');
            }}
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
