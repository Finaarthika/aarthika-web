import React, { useState } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, prefix }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2 text-gray-500 text-[14px]">{prefix}</span>}
      <input
        type="number"
        value={value === 0 ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-md py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
      />
    </div>
  </div>
);

const RadioCard = ({ title, desc, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 border rounded-xl cursor-pointer transition-all ${selected ? 'border-green-600 bg-green-50/30' : 'border-gray-200 hover:border-green-400'}`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-4 h-4 mt-0.5 rounded-full border flex-shrink-0 flex items-center justify-center ${selected ? 'border-green-600' : 'border-gray-400'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-green-600" />}
      </div>
      <div>
        <h4 className="text-[14px] font-semibold text-slate-800">{title}</h4>
        <p className="text-[12px] text-gray-500 leading-tight mt-1">{desc}</p>
      </div>
    </div>
  </div>
);

export default function BusinessIncome() {
  const { taxData, updateTaxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { business } = taxData;
  const balanceSheet = business.balanceSheet;
  const [scheme, setScheme] = useState('44AD');

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Your Business, Professional, Freelancing Income Details</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-bold text-lg text-slate-800">Business Income</h3>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center mb-6">
          <span className="text-[14px] font-bold text-slate-800">Select Business Income Type</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 rounded-full border border-green-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-600" />
              </div>
              <span className="text-[14px] font-semibold text-green-700">Presumptive Income</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center"></div>
              <span className="text-[14px] font-semibold text-slate-700">Normal Business Income</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <RadioCard 
            title="Presumptive Scheme u/s 44AD" 
            desc="For businesses such as manufacturing, real estate, retail, agriculture, mills etc."
            selected={scheme === '44AD'}
            onClick={() => setScheme('44AD')}
          />
          <RadioCard 
            title="Presumptive Scheme u/s 44ADA" 
            desc="For professionals such as doctors, lawyers, designers, engineers, architects etc."
            selected={scheme === '44ADA'}
            onClick={() => setScheme('44ADA')}
          />
          <RadioCard 
            title="Presumptive Scheme u/s 44AE" 
            desc="For businesses including leasing, renting or transporting goods carriages."
            selected={scheme === '44AE'}
            onClick={() => setScheme('44AE')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <TaxInput label="Business Category *" placeholder="Please Select" />
          <TaxInput label="Nature of Business *" placeholder="Please Select" />
          <TaxInput label="Name of the Business *" />
          <TaxInput label="Description (Optional)" />
        </div>

        <h4 className="text-[15px] font-bold text-slate-800 mb-4">Turnover & Profit Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50">
            <h5 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Digital / Bank Receipts
            </h5>
            <div className="space-y-4">
              <TaxInput label="Gross Digital Receipts" prefix="₹" />
              <TaxInput 
                label={`Presumptive Profit (Min ${scheme === '44ADA' ? '50%' : '6%'})`} 
                value={business.profitBank} 
                onChange={(e) => updateNestedTaxData('business', 'profitBank', e.target.value === '' ? '' : Number(e.target.value))}
                prefix="₹" 
              />
            </div>
          </div>
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50">
            <h5 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Cash Receipts
            </h5>
            <div className="space-y-4">
              <TaxInput label="Gross Cash Receipts" prefix="₹" />
              <TaxInput 
                label={`Presumptive Profit (Min ${scheme === '44ADA' ? '50%' : '8%'})`} 
                value={business.profitCash} 
                onChange={(e) => updateNestedTaxData('business', 'profitCash', e.target.value === '' ? '' : Number(e.target.value))}
                prefix="₹" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">2</div>
          <h3 className="font-bold text-lg text-slate-800">Balance Sheet (Optional)</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">Required if total gross receipts exceed ₹50 Lakhs (44ADA) or ₹2 Crores (44AD).</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h4 className="text-md font-bold text-slate-700 pb-2 mb-4 border-b border-gray-200">ASSETS</h4>
            <div className="space-y-4 mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fixed Assets</h5>
              <TaxInput label="Gross Block" value={balanceSheet.fixedGrossBlock} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'fixedGrossBlock', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Depreciation" value={balanceSheet.fixedDepreciation} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'fixedDepreciation', Number(e.target.value))} prefix="₹" />
            </div>
            <div className="space-y-4 mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Investments</h5>
              <TaxInput label="Short Term Investments" value={balanceSheet.investmentsST} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'investmentsST', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Long Term Investments" value={balanceSheet.investmentsLT} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'investmentsLT', Number(e.target.value))} prefix="₹" />
            </div>
            <div className="space-y-4 mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Assets</h5>
              <TaxInput label="Bank Balance" value={balanceSheet.currentBank} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentBank', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Cash Balance" value={balanceSheet.currentCash} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentCash', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Closing Stock" value={balanceSheet.currentStock} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentStock', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Receivables (Debtors)" value={balanceSheet.currentReceivables} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentReceivables', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Loans Given" value={balanceSheet.currentLoansGiven} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentLoansGiven', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Other Assets" value={balanceSheet.currentOther} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentOther', Number(e.target.value))} prefix="₹" />
            </div>
          </div>
          <div>
            <h4 className="text-md font-bold text-slate-700 pb-2 mb-4 border-b border-gray-200">LIABILITIES</h4>
            <div className="space-y-4 mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Equity</h5>
              <TaxInput label="Proprietor's Capital" value={balanceSheet.equityCapital} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'equityCapital', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Reserves & Surplus" value={balanceSheet.equityReserves} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'equityReserves', Number(e.target.value))} prefix="₹" />
            </div>
            <div className="space-y-4 mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Non-Current Liabilities</h5>
              <TaxInput label="Secured Loans" value={balanceSheet.nonCurrentSecured} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentSecured', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Unsecured Loans" value={balanceSheet.nonCurrentUnsecured} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentUnsecured', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Advances" value={balanceSheet.nonCurrentAdvances} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentAdvances', Number(e.target.value))} prefix="₹" />
            </div>
            <div className="space-y-4 mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Liabilities</h5>
              <TaxInput label="Payables (Creditors)" value={balanceSheet.currentPayables} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentPayables', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Provisions" value={balanceSheet.currentProvisions} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentProvisions', Number(e.target.value))} prefix="₹" />
              <TaxInput label="Other Liabilities" value={balanceSheet.currentOtherLiab} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentOtherLiab', Number(e.target.value))} prefix="₹" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate('/taxation/bank-accounts')} className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => {
              if (taxData.incomes.hasCapitalGains) navigate('/taxation/capital-gains');
              else if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
              else navigate('/taxation/exempt-income');
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
