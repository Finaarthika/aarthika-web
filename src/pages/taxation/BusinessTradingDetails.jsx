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

export default function BusinessTradingDetails() {
  const { taxData, updateNestedTaxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const { business } = taxData;
  const balanceSheet = business.balanceSheet;

  const totalTurnover = Number(business.turnoverBank) + Number(business.turnoverCash);
  const totalIncome = Number(business.profitBank) + Number(business.profitCash);

  const totalAssets = 
    Number(balanceSheet.fixedGrossBlock || 0) + 
    Number(balanceSheet.currentStock || 0) + 
    Number(balanceSheet.currentBank || 0) + 
    Number(balanceSheet.currentCash || 0) + 
    Number(balanceSheet.currentReceivables || 0) + 
    Number(balanceSheet.currentLoansGiven || 0) + 
    Number(balanceSheet.investmentsST || 0) + 
    Number(balanceSheet.investmentsLT || 0) + 
    Number(balanceSheet.currentOther || 0);

  const totalLiabilities = 
    Number(balanceSheet.equityCapital || 0) +
    Number(balanceSheet.equityReserves || 0) +
    Number(balanceSheet.nonCurrentSecured || 0) +
    Number(balanceSheet.nonCurrentUnsecured || 0) +
    Number(balanceSheet.nonCurrentAdvances || 0) +
    Number(balanceSheet.currentPayables || 0) +
    Number(balanceSheet.currentProvisions || 0) +
    Number(balanceSheet.currentOtherLiab || 0);

  const formatIN = (val) => new Intl.NumberFormat('en-IN').format(val);

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">BUSINESS & TRADING DETAILS</h1>
        <p className="text-[15px] text-gray-500 font-medium">Provide transaction details like turnover, and more.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
        <h3 className="font-bold text-[15px] text-slate-800 mb-6">
          Presumptive Income Under Section {business.presumptiveType}: {business.businessName || 'Business Name'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <TaxInput 
            label="Gross turnover through bank" 
            required 
            value={business.turnoverBank} 
            onChange={(e) => updateTaxData('business', 'turnoverBank', e.target.value === '' ? '' : Number(e.target.value))} 
            prefix="₹" 
          />
          <TaxInput 
            label="Total income through bank" 
            required 
            note="Must be at least 6%"
            value={business.profitBank} 
            onChange={(e) => updateTaxData('business', 'profitBank', e.target.value === '' ? '' : Number(e.target.value))} 
            prefix="₹" 
          />
          <TaxInput 
            label="Gross turnover through cash" 
            required 
            value={business.turnoverCash} 
            onChange={(e) => updateTaxData('business', 'turnoverCash', e.target.value === '' ? '' : Number(e.target.value))} 
            prefix="₹" 
          />
          <TaxInput 
            label="Total income through cash" 
            required 
            note="Must be at least 8%"
            value={business.profitCash} 
            onChange={(e) => updateTaxData('business', 'profitCash', e.target.value === '' ? '' : Number(e.target.value))} 
            prefix="₹" 
          />
        </div>

        <div className="bg-[#f8f9fa] rounded-lg">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <span className="font-bold text-[14px] text-slate-800">Total Turnover</span>
            <span className="font-bold text-[15px] text-slate-800">₹ {formatIN(totalTurnover)}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="font-bold text-[14px] text-slate-800">Total Income</span>
            <span className="font-bold text-[15px] text-slate-800">₹ {formatIN(totalIncome)}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-[15px] text-slate-800">Financial Particulars (as on 31st March)</span>
            <div className="flex items-center rounded-full border border-gray-300 overflow-hidden">
              <button 
                onClick={() => updateTaxData('business', 'hasFinancialParticulars', false)}
                className={`px-6 py-1.5 text-[13px] font-bold ${!business.hasFinancialParticulars ? 'bg-white text-slate-700' : 'bg-gray-100 text-gray-500'}`}
              >
                No
              </button>
              <button 
                onClick={() => updateTaxData('business', 'hasFinancialParticulars', true)}
                className={`px-6 py-1.5 text-[13px] font-bold ${business.hasFinancialParticulars ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                Yes
              </button>
            </div>
          </div>

          {business.hasFinancialParticulars && (
            <>
              {/* Assets Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-[15px] text-slate-800">Assets</h4>
                  <span className="font-bold text-[14px] text-slate-800">Total Assets: ₹ {formatIN(totalAssets)}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <TaxInput label="Fixed Assets" value={balanceSheet.fixedGrossBlock} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'fixedGrossBlock', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Stock-in-Trade" required value={balanceSheet.currentStock} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentStock', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Balance with Banks" value={balanceSheet.currentBank} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentBank', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Cash Balance" required value={balanceSheet.currentCash} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentCash', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Sundry Debtors" required value={balanceSheet.currentReceivables} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentReceivables', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Loans and Advances" value={balanceSheet.currentLoansGiven} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentLoansGiven', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Investments" value={balanceSheet.investmentsST} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'investmentsST', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Other Assets" value={balanceSheet.currentOther} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentOther', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                </div>
              </div>

              {/* Liabilities Section */}
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-[15px] text-slate-800">Capital and Liabilities</h4>
                  <span className="font-bold text-[14px] text-slate-800">Total Capital and Liabilities: ₹ {formatIN(totalLiabilities)}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <TaxInput label="Proprietor's Capital" required value={balanceSheet.equityCapital} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'equityCapital', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Reserves & Surplus" value={balanceSheet.equityReserves} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'equityReserves', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Sundry Creditors" required value={balanceSheet.currentPayables} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentPayables', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Secured Loans" value={balanceSheet.nonCurrentSecured} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentSecured', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Unsecured Loans" value={balanceSheet.nonCurrentUnsecured} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentUnsecured', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Provisions" value={balanceSheet.currentProvisions} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentProvisions', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Advances" value={balanceSheet.nonCurrentAdvances} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'nonCurrentAdvances', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                  <TaxInput label="Other Liabilities" value={balanceSheet.currentOtherLiab} onChange={(e) => updateNestedTaxData('business', 'balanceSheet', 'currentOtherLiab', e.target.value === '' ? '' : Number(e.target.value))} prefix="₹" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate('/taxation/business')} className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => navigate('/taxation/other-sources')}
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
