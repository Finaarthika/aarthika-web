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
    updateTaxData('business', e.target.name, e.target.type === 'number' ? e.target.value === '' ? '' : Number(e.target.value) : e.target.value);
  };

  const handleBalanceSheetChange = (e) => {
    updateNestedTaxData('business', 'balanceSheet', e.target.name, e.target.value === '' ? '' : Number(e.target.value));
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

  const cashPercentage = totalTurnover > 0 ? (Number(business.turnoverCash) / totalTurnover) * 100 : 0;
  
  // 44AD Strict Limits Validation
  let presumptiveError = null;
  if (cashPercentage > 5 && totalTurnover > 20000000) {
    presumptiveError = "Turnover exceeds ₹2 Crore limit (since cash receipts > 5%). You are not eligible for Presumptive Taxation u/s 44AD. Tax Audit is mandatory.";
  } else if (totalTurnover > 30000000) {
    presumptiveError = "Turnover exceeds ₹3 Crore limit. You are not eligible for Presumptive Taxation u/s 44AD. Tax Audit is mandatory.";
  }

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
              <>
                <InputField 
                  label="GSTIN" 
                  type="text" 
                  prefix=""
                  value={business.gstin} 
                  onChange={(e) => updateTaxData('business', 'gstin', e.target.value)} 
                />
                <InputField 
                  label="Turnover as per GST Return (GSTR-3B)" 
                  type="number" 
                  prefix="₹"
                  value={business.gstTurnover || ''} 
                  onChange={(e) => updateTaxData('business', 'gstTurnover', e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </>
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
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Business Nature Code (For ITR)</label>
              <select
                className="w-full bg-[#121212] border border-gray-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={business.businessNatureCode}
                onChange={(e) => updateTaxData('business', 'businessNatureCode', e.target.value)}
              >
                <option value="09005">09005 - Retail Sale of Other Products</option>
                <option value="09028">09028 - Retail sale of other goods</option>
                <option value="14001">14001 - Software development</option>
                <option value="16013">16013 - Legal profession</option>
                <option value="16019">16019 - Other professional services</option>
                <option value="21008">21008 - Other services n.e.c</option>
              </select>
            </div>
          </div>
        </div>

        {/* Turnover & Profit */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">2</span>
            Gross Receipts & Profit
          </h3>

          {presumptiveError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-red-400 font-bold">Eligibility Alert</h4>
                <p className="text-red-300 text-sm mt-1">{presumptiveError}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-300 pb-2 border-b border-gray-800">Digital / Bank Mode</h4>
              <InputField 
                label="Gross Receipts (Bank)" 
                value={business.turnoverBank} 
                onChange={(e) => updateTaxData('business', 'turnoverBank', e.target.value === '' ? '' : Number(e.target.value))} 
              />
              <InputField 
                label="Declared Profit (Bank)" 
                value={business.profitBank} 
                onChange={(e) => updateTaxData('business', 'profitBank', e.target.value === '' ? '' : Number(e.target.value))} 
                requiredMsg={bankProfitError}
              />
            </div>
            
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-300 pb-2 border-b border-gray-800">Cash / Other Mode</h4>
              <InputField 
                label="Gross Receipts (Cash)" 
                value={business.turnoverCash} 
                onChange={(e) => updateTaxData('business', 'turnoverCash', e.target.value === '' ? '' : Number(e.target.value))} 
              />
              <InputField 
                label="Declared Profit (Cash)" 
                value={business.profitCash} 
                onChange={(e) => updateTaxData('business', 'profitCash', e.target.value === '' ? '' : Number(e.target.value))} 
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {/* Assets */}
            <div>
              <h4 className="text-md font-bold text-blue-400 pb-2 mb-4 border-b border-gray-800">ASSETS</h4>
              
              <div className="space-y-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase">Fixed Assets</h5>
                <InputField label="Gross Block" value={balanceSheet.fixedGrossBlock} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'fixedGrossBlock', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Depreciation" value={balanceSheet.fixedDepreciation} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'fixedDepreciation', e.target.value === '' ? '' : Number(e.target.value))} />
                <div className="flex justify-between text-sm py-2 px-4 bg-[#121212] rounded">
                  <span className="text-gray-400">Net Block:</span>
                  <span className="text-white font-medium">₹{(Number(balanceSheet.fixedGrossBlock) - Number(balanceSheet.fixedDepreciation)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase">Investments</h5>
                <InputField label="Short Term Investments" value={balanceSheet.investmentsST} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'investmentsST', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Long Term Investments" value={balanceSheet.investmentsLT} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'investmentsLT', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

              <div className="space-y-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase">Current Assets</h5>
                <InputField label="Bank Balance" value={balanceSheet.currentBank} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentBank', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Cash Balance" value={balanceSheet.currentCash} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentCash', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Stock in Trade / Inventory" value={balanceSheet.currentStock} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentStock', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Sundry Debtors / Receivables" value={balanceSheet.currentReceivables} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentReceivables', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Loans & Advances Given" value={balanceSheet.currentLoansGiven} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentLoansGiven', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Other Current Assets" value={balanceSheet.currentOther} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentOther', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
            
            {/* Liabilities */}
            <div>
              <h4 className="text-md font-bold text-red-400 pb-2 mb-4 border-b border-gray-800">LIABILITIES</h4>
              
              <div className="space-y-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase">Equity</h5>
                <InputField label="Proprietor's Capital" value={balanceSheet.equityCapital} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'equityCapital', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Reserves & Surplus" value={balanceSheet.equityReserves} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'equityReserves', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

              <div className="space-y-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase">Non-Current Liabilities</h5>
                <InputField label="Secured Loans" value={balanceSheet.nonCurrentSecured} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentSecured', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Unsecured Loans" value={balanceSheet.nonCurrentUnsecured} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentUnsecured', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Advances" value={balanceSheet.nonCurrentAdvances} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentAdvances', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

              <div className="space-y-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-500 uppercase">Current Liabilities</h5>
                <InputField label="Sundry Creditors / Payables" value={balanceSheet.currentPayables} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentPayables', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Provisions for Expenses" value={balanceSheet.currentProvisions} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentProvisions', e.target.value === '' ? '' : Number(e.target.value))} />
                <InputField label="Other Current Liabilities" value={balanceSheet.currentOtherLiab} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentOtherLiab', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Balancing Figure Alert */}
          {(() => {
            const totalAssets = (Number(balanceSheet.fixedGrossBlock) - Number(balanceSheet.fixedDepreciation)) +
              Number(balanceSheet.investmentsST) + Number(balanceSheet.investmentsLT) +
              Number(balanceSheet.currentBank) + Number(balanceSheet.currentCash) + Number(balanceSheet.currentStock) +
              Number(balanceSheet.currentReceivables) + Number(balanceSheet.currentLoansGiven) + Number(balanceSheet.currentOther);
              
            const totalLiabilities = Number(balanceSheet.equityCapital) + Number(balanceSheet.equityReserves) +
              Number(balanceSheet.nonCurrentSecured) + Number(balanceSheet.nonCurrentUnsecured) + Number(balanceSheet.nonCurrentAdvances) +
              Number(balanceSheet.currentPayables) + Number(balanceSheet.currentProvisions) + Number(balanceSheet.currentOtherLiab);
              
            const difference = Math.abs(totalAssets - totalLiabilities);
            
            if (difference > 0) {
              return (
                <div className="mt-8 p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="text-orange-400 font-bold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Balance Sheet Mismatch
                    </h4>
                    <p className="text-orange-300/80 text-sm mt-1">Total Assets (₹{totalAssets.toLocaleString('en-IN')}) and Total Liabilities (₹{totalLiabilities.toLocaleString('en-IN')}) do not match.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400/80 text-xs font-semibold uppercase tracking-wider mb-1">Balancing Figure</p>
                    <p className="text-2xl font-bold text-orange-400">₹{difference.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            }
            return (
              <div className="mt-8 p-4 bg-emerald-900/20 border border-emerald-500/50 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Balance Sheet Tally Matched
                  </h4>
                  <p className="text-emerald-300/80 text-sm mt-1">Total Assets (₹{totalAssets.toLocaleString('en-IN')}) exactly match Total Liabilities.</p>
                </div>
              </div>
            );
          })()}
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
