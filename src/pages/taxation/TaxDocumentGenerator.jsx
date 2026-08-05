import React, { useRef, useState, useMemo } from 'react';
import { useTaxation } from './TaxationContext';
import html2pdf from 'html2pdf.js';

// Reusing the calculation logic (in a real app, this should be abstracted into a utility hook/file)
const calculateSlabTax = (income) => {
  let tax = 0;
  if (income > 1500000) { tax += (income - 1500000) * 0.30; income = 1500000; }
  if (income > 1200000) { tax += (income - 1200000) * 0.20; income = 1200000; }
  if (income > 1000000) { tax += (income - 1000000) * 0.15; income = 1000000; }
  if (income > 700000) { tax += (income - 700000) * 0.10; income = 700000; }
  if (income > 300000) { tax += (income - 300000) * 0.05; }
  return tax;
};

const DocumentPreview = ({ data, computation }) => {
  const formatCur = (num) => `₹${Number(num).toLocaleString('en-IN')}`;
  const { clientDetails, business, capitalGains, otherSources } = data;
  const bs = business.balanceSheet;

  return (
    <div id="tax-document-content" className="p-10 bg-white text-black font-sans w-[800px] min-h-[1122px] mx-auto text-sm leading-relaxed" style={{ color: '#333' }}>
      
      {/* Header */}
      <div className="text-center mb-10 pb-4 border-b-2 border-gray-800">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-900">Tax Computation & Financials</h1>
        <p className="text-gray-500 mt-1">Assessment Year {clientDetails.assessmentYear}</p>
      </div>

      {/* Client Profile */}
      <div className="mb-8 grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Client Name</p>
          <p className="font-bold text-lg">{clientDetails.firstName} {clientDetails.lastName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">PAN Number</p>
          <p className="font-bold text-lg uppercase">{clientDetails.pan}</p>
        </div>
      </div>

      {/* Part A: Profit & Loss */}
      {data.incomes.hasBusiness && (
        <div className="mb-10">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-4 text-blue-900">Part A: Profit & Loss Account (Sec 44AD)</h2>
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 pl-2">Gross Receipts (Digital/Bank)</td>
                <td className="py-2 text-right pr-2">{formatCur(business.turnoverBank)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pl-2">Gross Receipts (Cash/Other)</td>
                <td className="py-2 text-right pr-2">{formatCur(business.turnoverCash)}</td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50 font-semibold">
                <td className="py-2 pl-2">Total Gross Receipts</td>
                <td className="py-2 text-right pr-2">{formatCur(Number(business.turnoverBank) + Number(business.turnoverCash))}</td>
              </tr>
              <tr><td colSpan="2" className="py-2"></td></tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pl-2">Presumptive Profit (Digital Mode)</td>
                <td className="py-2 text-right pr-2">{formatCur(business.profitBank)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pl-2">Presumptive Profit (Cash Mode)</td>
                <td className="py-2 text-right pr-2">{formatCur(business.profitCash)}</td>
              </tr>
              <tr className="border-b-2 border-gray-800 bg-gray-50 font-bold text-base">
                <td className="py-3 pl-2">Net Profit transferred to Capital A/C</td>
                <td className="py-3 text-right pr-2">{formatCur(Number(business.profitBank) + Number(business.profitCash))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Part B: Balance Sheet */}
      {data.incomes.hasBusiness && (
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-4 text-blue-900">Part B: Balance Sheet (as of 31st March)</h2>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Liabilities */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 underline">Sources of Funds</h3>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1">Proprietor's Capital</td><td className="text-right">{formatCur(bs.proprietorCapital)}</td></tr>
                  <tr><td className="py-1">Reserves & Surplus</td><td className="text-right">{formatCur(bs.reservesAndSurplus)}</td></tr>
                  <tr><td className="py-1">Sundry Creditors</td><td className="text-right">{formatCur(bs.sundryCreditors)}</td></tr>
                  <tr className="border-t border-gray-400 font-bold"><td className="py-2">Total</td><td className="text-right">{formatCur(bs.proprietorCapital + bs.reservesAndSurplus + bs.sundryCreditors)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Assets */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 underline">Application of Funds</h3>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1">Fixed Assets / Inventory</td><td className="text-right">{formatCur(bs.inventory)}</td></tr>
                  <tr><td className="py-1">Sundry Debtors</td><td className="text-right">{formatCur(bs.sundryDebtors)}</td></tr>
                  <tr><td className="py-1">Cash Balance</td><td className="text-right">{formatCur(bs.cashBalance)}</td></tr>
                  <tr><td className="py-1">Bank Balance</td><td className="text-right">{formatCur(bs.bankBalance)}</td></tr>
                  <tr className="border-t border-gray-400 font-bold"><td className="py-2">Total</td><td className="text-right">{formatCur(bs.inventory + bs.sundryDebtors + bs.cashBalance + bs.bankBalance)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Part C: Tax Computation */}
      <div className="mb-10 html2pdf__page-break">
        <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-4 text-blue-900">Part C: Computation of Total Income & Tax</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 pl-2">Particulars</th>
              <th className="py-2 text-right">Amount (₹)</th>
              <th className="py-2 text-right pr-2">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan="3" className="py-2 font-semibold">1. Income from Business & Profession</td></tr>
            <tr><td className="pl-6 py-1 text-gray-600">Presumptive Income u/s 44AD</td><td className="text-right">{formatCur(computation.breakdown[0].gross)}</td><td></td></tr>
            <tr><td className="pl-6 py-1 text-gray-600 border-b border-gray-200">Less: BFLA Adjusted</td><td className="text-right border-b border-gray-200">{formatCur(computation.breakdown[0].bfla)}</td><td className="text-right font-medium">{formatCur(computation.breakdown[0].taxable)}</td></tr>
            
            <tr><td colSpan="3" className="py-2 font-semibold pt-4">2. Capital Gains</td></tr>
            <tr><td className="pl-6 py-1 text-gray-600">Short-Term Capital Gains (STCG)</td><td className="text-right">{formatCur(computation.breakdown[1].gross)}</td><td></td></tr>
            <tr><td className="pl-6 py-1 text-gray-600 border-b border-gray-200">Less: STCL Adjusted</td><td className="text-right border-b border-gray-200">{formatCur(computation.breakdown[1].bfla)}</td><td className="text-right font-medium">{formatCur(computation.breakdown[1].taxable)}</td></tr>
            <tr><td className="pl-6 py-1 text-gray-600 pt-2">Long-Term Capital Gains (LTCG)</td><td className="text-right">{formatCur(computation.breakdown[2].gross)}</td><td></td></tr>
            <tr><td className="pl-6 py-1 text-gray-600 border-b border-gray-200">Less: LTCL Adjusted</td><td className="text-right border-b border-gray-200">{formatCur(computation.breakdown[2].bfla)}</td><td className="text-right font-medium">{formatCur(computation.breakdown[2].taxable)}</td></tr>
            
            <tr><td colSpan="3" className="py-2 font-semibold pt-4">3. Income from Other Sources</td></tr>
            <tr><td className="pl-6 py-1 text-gray-600">Interest / Dividend / Other</td><td className="text-right border-b border-gray-200">{formatCur(computation.breakdown[3].gross)}</td><td className="text-right font-medium">{formatCur(computation.breakdown[3].taxable)}</td></tr>

            {(data.exemptIncome.agriculture > 0 || data.exemptIncome.ppfInterest > 0 || data.exemptIncome.otherExempt > 0) && (
              <>
                <tr><td colSpan="3" className="py-2 font-semibold pt-4 text-green-700">4. Exempt Income (Not Taxable)</td></tr>
                {data.exemptIncome.agriculture > 0 && <tr><td className="pl-6 py-1 text-gray-600">Agricultural Income</td><td className="text-right">{formatCur(data.exemptIncome.agriculture)}</td><td></td></tr>}
                {data.exemptIncome.ppfInterest > 0 && <tr><td className="pl-6 py-1 text-gray-600">PPF / EPF Interest</td><td className="text-right">{formatCur(data.exemptIncome.ppfInterest)}</td><td></td></tr>}
                {data.exemptIncome.otherExempt > 0 && <tr><td className="pl-6 py-1 text-gray-600">Other Exempt Income</td><td className="text-right">{formatCur(data.exemptIncome.otherExempt)}</td><td></td></tr>}
              </>
            )}

            <tr className="bg-gray-50 border-y-2 border-gray-800 font-bold text-base mt-4">
              <td className="py-3 pl-2">Gross Total Taxable Income</td>
              <td></td>
              <td className="text-right pr-2">{formatCur(computation.totalIncome)}</td>
            </tr>

            {/* Tax Calculation */}
            <tr><td colSpan="3" className="py-4 font-semibold text-lg text-blue-900 border-b border-gray-200">Tax Liability (New Regime)</td></tr>
            <tr><td className="pl-2 py-2">Tax on Normal Income (Slab Rates)</td><td></td><td className="text-right">{formatCur(computation.taxOnNormalIncome)}</td></tr>
            <tr><td className="pl-2 py-2">Tax on STCG @ 20%</td><td></td><td className="text-right">{formatCur(computation.taxOnStcg)}</td></tr>
            <tr><td className="pl-2 py-2">Tax on LTCG @ 12.5% (above ₹1.25L)</td><td></td><td className="text-right">{formatCur(computation.taxOnLtcg)}</td></tr>
            <tr className="border-t border-gray-200 font-semibold"><td className="pl-2 py-2">Total Tax Computed</td><td></td><td className="text-right">{formatCur(computation.totalTaxBase)}</td></tr>
            <tr><td className="pl-2 py-2">Less: Rebate u/s 87A</td><td></td><td className="text-right text-green-700">({formatCur(computation.rebate87A)})</td></tr>
            <tr><td className="pl-2 py-2 border-b border-gray-200">Add: Health & Education Cess @ 4%</td><td></td><td className="text-right border-b border-gray-200">{formatCur(computation.cess)}</td></tr>
            <tr className="bg-gray-100 border-y-2 border-gray-800 font-bold text-lg">
              <td className="py-4 pl-2">Net Tax Payable / (Refundable)</td>
              <td></td>
              <td className="text-right pr-2">{formatCur(computation.finalTaxLiability)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>This is a computer-generated tax computation statement. Please verify with official ITR filings.</p>
        <p className="font-semibold mt-1">Generated by TaxStudio Pro</p>
      </div>
    </div>
  );
};

export default function TaxDocumentGenerator({ onClose }) {
  const { taxData } = useTaxation();
  const [isGenerating, setIsGenerating] = useState(false);

  // Exact same math as Computation.jsx
  const computation = useMemo(() => {
    const grossBusiness = Number(taxData.business.profitBank) + Number(taxData.business.profitCash);
    const grossStcg = Number(taxData.capitalGains.stcg);
    const grossLtcg = Number(taxData.capitalGains.ltcg);
    const dividendSum = Object.values(taxData.otherSources.dividend).reduce((sum, val) => sum + Number(val), 0);
    const grossOther = Number(taxData.otherSources.savingsInterest) + Number(taxData.otherSources.fdInterest) + 
                       Number(taxData.otherSources.taxRefundInterest) + Number(taxData.otherSources.anyOtherIncome) + dividendSum;
    const taxableBusiness = Math.max(0, grossBusiness - Number(taxData.bfla.businessLoss));
    let remainingStcgLoss = Number(taxData.bfla.stcgLoss);
    const taxableStcg = Math.max(0, grossStcg - remainingStcgLoss);
    remainingStcgLoss = Math.max(0, remainingStcgLoss - grossStcg);
    const taxableLtcg = Math.max(0, grossLtcg - Number(taxData.bfla.ltcgLoss) - remainingStcgLoss);
    const taxableOther = grossOther; 
    const totalIncome = taxableBusiness + taxableStcg + taxableLtcg + taxableOther;
    const normalIncome = taxableBusiness + taxableOther;
    const taxOnNormalIncome = calculateSlabTax(normalIncome);
    const taxOnStcg = taxableStcg * 0.20;
    const ltcgAboveExemption = Math.max(0, taxableLtcg - 125000);
    const taxOnLtcg = ltcgAboveExemption * 0.125;
    let totalTaxBase = taxOnNormalIncome + taxOnStcg + taxOnLtcg;
    let rebate87A = totalIncome <= 700000 ? Math.min(totalTaxBase, 25000) : 0;
    const taxAfterRebate = Math.max(0, totalTaxBase - rebate87A);
    const cess = taxAfterRebate * 0.04;
    const finalTaxLiability = Math.round(taxAfterRebate + cess);

    return {
      breakdown: [
        { gross: grossBusiness, bfla: taxData.bfla.businessLoss, taxable: taxableBusiness },
        { gross: grossStcg, bfla: taxData.bfla.stcgLoss, taxable: taxableStcg },
        { gross: grossLtcg, bfla: taxData.bfla.ltcgLoss, taxable: taxableLtcg },
        { gross: grossOther, bfla: 0, taxable: taxableOther },
      ],
      totalIncome, normalIncome, taxOnNormalIncome, taxOnStcg, taxOnLtcg, totalTaxBase, rebate87A, cess, finalTaxLiability
    };
  }, [taxData]);

  const generatePDF = () => {
    setIsGenerating(true);
    const element = document.getElementById('tax-document-content');
    
    const opt = {
      margin:       10,
      filename:     `Tax_Computation_${taxData.clientDetails.pan || 'Client'}.pdf`,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a] rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Document Preview</h2>
            <p className="text-gray-400 text-sm">Review the generated document before saving.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-2 rounded-lg font-medium text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-bold text-white transition-colors flex items-center gap-2 ${isGenerating ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                'Download Professional PDF'
              )}
            </button>
          </div>
        </div>
        
        {/* Scrollable Preview Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-gray-900 custom-scrollbar">
          <div className="shadow-2xl rounded">
            <DocumentPreview data={taxData} computation={computation} />
          </div>
        </div>
      </div>
    </div>
  );
}
