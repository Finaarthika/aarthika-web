import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { useTaxation } from './TaxationContext';
import Computation from './Computation'; // Used to derive computations if needed, but we calculate locally or pass it.

// Helper to format currency
const formatCur = (num) => {
  if (!num) return '₹0';
  return '₹' + Number(num).toLocaleString('en-IN');
};

export default function TaxDocumentGenerator({ onClose }) {
  const { taxData } = useTaxation();
  const documentRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const data = taxData;
  const { business } = data;

  // Replicate basic math for PDF display
  const grossBusiness = Number(business.profitBank) + Number(business.profitCash);
  const grossStcg = Object.values(data.capitalGains.stcg).reduce((sum, val) => sum + Number(val), 0);
  const grossLtcg = Object.values(data.capitalGains.ltcg).reduce((sum, val) => sum + Number(val), 0);
  const dividendSum = Object.values(data.otherSources.dividend).reduce((sum, val) => sum + Number(val), 0);
  
  const totalGifts = Number(data.otherSources.gifts.monetary) + Number(data.otherSources.gifts.movable) + Number(data.otherSources.gifts.immovable);
  const taxableGifts = (!data.otherSources.gifts.isExemptOccasion && totalGifts > 50000) ? totalGifts : 0;

  const grossOther = Number(data.otherSources.savingsInterest) + Number(data.otherSources.fdInterest) + 
                     Number(data.otherSources.taxRefundInterest) + Number(data.otherSources.bondsInterest) +
                     Number(data.otherSources.epfInterest) + Number(data.otherSources.loansInterest) +
                     Number(data.otherSources.anyOtherIncome) + dividendSum + taxableGifts;

  const taxableBusiness = Math.max(0, grossBusiness - Number(data.bfla.businessLoss));
  let remainingStcgLoss = Number(data.bfla.stcgLoss);
  const taxableStcg = Math.max(0, grossStcg - remainingStcgLoss);
  remainingStcgLoss = Math.max(0, remainingStcgLoss - grossStcg);
  const taxableLtcg = Math.max(0, grossLtcg - Number(data.bfla.ltcgLoss) - remainingStcgLoss);
  
  const grossTotalIncome = taxableBusiness + taxableStcg + taxableLtcg + grossOther;
  const totalDeductions = Number(data.deductions.sec80CCD2) + Number(data.deductions.sec80CCH);
  const totalIncome = Math.max(0, grossTotalIncome - totalDeductions);
  const totalPrepaid = Number(data.prepaidTaxes.advanceTax) + Number(data.prepaidTaxes.tdsSalary) + Number(data.prepaidTaxes.tdsOther) + Number(data.prepaidTaxes.tcs);
  
  const computation = {
    breakdown: [
      { taxable: taxableBusiness },
      { taxable: taxableStcg },
      { taxable: taxableLtcg },
      { taxable: grossOther }
    ]
  };

  const handleDownload = () => {
    setIsGenerating(true);
    const element = documentRef.current;
    
    const opt = {
      margin: 10,
      filename: `Tax_Computation_${data.clientDetails.pan || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-4xl w-full shadow-2xl relative my-8">
        
        {/* Header Actions */}
        <div className="sticky top-0 bg-[#121212] z-10 border-b border-gray-800 p-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Document Preview</h2>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating PDF...
                </>
              ) : (
                'Download PDF'
              )}
            </button>
          </div>
        </div>

        {/* Hidden A4 Container for PDF generation */}
        <div className="overflow-x-auto p-4 bg-gray-900 flex justify-center">
          <div 
            ref={documentRef}
            className="bg-white text-black p-10 shadow-lg"
            style={{ width: '210mm', minHeight: '297mm', fontSize: '12px' }} // Standard A4 dimensions
          >
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900">Income Tax Statement</h1>
              <h2 className="text-sm font-bold text-gray-600 mt-1">Financial Year 2025-26 | Assessment Year 2026-27</h2>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 mb-8 border border-gray-300 p-4 rounded bg-gray-50">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Client Name</p>
                <p className="font-semibold text-base">{data.clientDetails.firstName} {data.clientDetails.lastName || 'Client'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">PAN Number</p>
                <p className="font-semibold text-base uppercase">{data.clientDetails.pan || 'NOT PROVIDED'}</p>
              </div>
            </div>

            {data.incomes.hasBusiness && (
              <>
                <h3 className="text-lg font-bold bg-gray-200 p-2 mb-4">Part A: Profit & Loss Statement (Sec 44AD)</h3>
                <div className="mb-8">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr><td className="py-1 font-semibold w-2/3">1. Gross Receipts</td><td className="text-right"></td></tr>
                      <tr><td className="pl-6 py-1 text-gray-600">Via Banking Channels</td><td className="text-right">{formatCur(business.turnoverBank)}</td></tr>
                      <tr><td className="pl-6 py-1 text-gray-600 border-b border-gray-200">Via Cash / Other Modes</td><td className="text-right border-b border-gray-200">{formatCur(business.turnoverCash)}</td></tr>
                      <tr><td className="py-2 font-bold pl-6">Total Gross Receipts</td><td className="text-right font-bold">{formatCur(Number(business.turnoverBank) + Number(business.turnoverCash))}</td></tr>
                      
                      <tr><td className="py-2 font-semibold pt-4">2. Presumptive Profit Declared</td><td className="text-right"></td></tr>
                      <tr><td className="pl-6 py-1 text-gray-600">On Banking Turnover</td><td className="text-right">{formatCur(business.profitBank)}</td></tr>
                      <tr><td className="pl-6 py-1 text-gray-600 border-b border-gray-200">On Cash Turnover</td><td className="text-right border-b border-gray-200">{formatCur(business.profitCash)}</td></tr>
                      <tr className="bg-gray-100"><td className="py-2 font-bold pl-6 text-base">Net Business Profit (Taxable)</td><td className="text-right font-bold text-base">{formatCur(grossBusiness)}</td></tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-bold bg-gray-200 p-2 mb-4" style={{ pageBreakBefore: 'auto' }}>Part B: Balance Sheet as on 31st March 2026</h3>
                <div className="mb-8 grid grid-cols-2 gap-8">
                  {/* Sources of Funds */}
                  <div>
                    <h4 className="font-bold border-b-2 border-gray-800 pb-1 mb-2 text-sm">Liabilities</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td colSpan="2" className="font-semibold text-xs text-gray-500 uppercase">Equity</td></tr>
                        <tr><td className="py-1">Proprietor's Capital</td><td className="text-right">{formatCur(business.balanceSheet.equityCapital)}</td></tr>
                        <tr><td className="py-1">Reserves & Surplus</td><td className="text-right">{formatCur(business.balanceSheet.equityReserves)}</td></tr>
                        
                        <tr><td colSpan="2" className="font-semibold text-xs text-gray-500 uppercase pt-2">Non-Current Liabilities</td></tr>
                        <tr><td className="py-1">Secured Loans</td><td className="text-right">{formatCur(business.balanceSheet.nonCurrentSecured)}</td></tr>
                        <tr><td className="py-1">Unsecured Loans</td><td className="text-right">{formatCur(business.balanceSheet.nonCurrentUnsecured)}</td></tr>
                        <tr><td className="py-1">Advances</td><td className="text-right">{formatCur(business.balanceSheet.nonCurrentAdvances)}</td></tr>

                        <tr><td colSpan="2" className="font-semibold text-xs text-gray-500 uppercase pt-2">Current Liabilities</td></tr>
                        <tr><td className="py-1">Sundry Creditors</td><td className="text-right">{formatCur(business.balanceSheet.currentPayables)}</td></tr>
                        <tr><td className="py-1">Provisions</td><td className="text-right">{formatCur(business.balanceSheet.currentProvisions)}</td></tr>
                        <tr><td className="py-1 border-b border-gray-200">Other Liabilities</td><td className="text-right border-b border-gray-200">{formatCur(business.balanceSheet.currentOtherLiab)}</td></tr>
                        <tr className="font-bold bg-gray-50"><td className="py-2">Total Liabilities</td><td className="text-right">{formatCur(
                          Number(business.balanceSheet.equityCapital) + Number(business.balanceSheet.equityReserves) +
                          Number(business.balanceSheet.nonCurrentSecured) + Number(business.balanceSheet.nonCurrentUnsecured) + Number(business.balanceSheet.nonCurrentAdvances) +
                          Number(business.balanceSheet.currentPayables) + Number(business.balanceSheet.currentProvisions) + Number(business.balanceSheet.currentOtherLiab)
                        )}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Application of Funds */}
                  <div>
                    <h4 className="font-bold border-b-2 border-gray-800 pb-1 mb-2 text-sm">Assets</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td colSpan="2" className="font-semibold text-xs text-gray-500 uppercase">Fixed Assets</td></tr>
                        <tr><td className="py-1">Net Block</td><td className="text-right">{formatCur(Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation))}</td></tr>
                        
                        <tr><td colSpan="2" className="font-semibold text-xs text-gray-500 uppercase pt-2">Investments</td></tr>
                        <tr><td className="py-1">Short Term</td><td className="text-right">{formatCur(business.balanceSheet.investmentsST)}</td></tr>
                        <tr><td className="py-1">Long Term</td><td className="text-right">{formatCur(business.balanceSheet.investmentsLT)}</td></tr>
                        
                        <tr><td colSpan="2" className="font-semibold text-xs text-gray-500 uppercase pt-2">Current Assets</td></tr>
                        <tr><td className="py-1">Bank Balance</td><td className="text-right">{formatCur(business.balanceSheet.currentBank)}</td></tr>
                        <tr><td className="py-1">Cash Balance</td><td className="text-right">{formatCur(business.balanceSheet.currentCash)}</td></tr>
                        <tr><td className="py-1">Stock / Inventory</td><td className="text-right">{formatCur(business.balanceSheet.currentStock)}</td></tr>
                        <tr><td className="py-1">Sundry Debtors</td><td className="text-right">{formatCur(business.balanceSheet.currentReceivables)}</td></tr>
                        <tr><td className="py-1">Loans Given</td><td className="text-right">{formatCur(business.balanceSheet.currentLoansGiven)}</td></tr>
                        <tr><td className="py-1 border-b border-gray-200">Other Current Assets</td><td className="text-right border-b border-gray-200">{formatCur(business.balanceSheet.currentOther)}</td></tr>
                        
                        <tr className="font-bold bg-gray-50"><td className="py-2">Total Assets</td><td className="text-right">{formatCur(
                          (Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation)) +
                          Number(business.balanceSheet.investmentsST) + Number(business.balanceSheet.investmentsLT) +
                          Number(business.balanceSheet.currentBank) + Number(business.balanceSheet.currentCash) + Number(business.balanceSheet.currentStock) +
                          Number(business.balanceSheet.currentReceivables) + Number(business.balanceSheet.currentLoansGiven) + Number(business.balanceSheet.currentOther)
                        )}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <h3 className="text-lg font-bold bg-gray-200 p-2 mb-4" style={{ pageBreakBefore: 'always' }}>Part C: Computation of Total Income & Tax</h3>
            <div className="mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800 text-gray-500">
                    <th className="py-2">Head of Income</th>
                    <th className="text-right">Total Income</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="py-2 font-semibold pt-4">1. Business & Profession</td><td className="text-right font-medium">{formatCur(computation.breakdown[0].taxable)}</td></tr>
                  
                  <tr><td className="py-2 font-semibold pt-4">2. Capital Gains</td><td className="text-right font-medium"></td></tr>
                  <tr><td className="pl-6 py-1 text-gray-600">Short-Term Capital Gains</td><td className="text-right">{formatCur(computation.breakdown[1].taxable)}</td></tr>
                  <tr><td className="pl-6 py-1 text-gray-600">Long-Term Capital Gains</td><td className="text-right">{formatCur(computation.breakdown[2].taxable)}</td></tr>

                  <tr><td className="py-2 font-semibold pt-4">3. Income from Other Sources</td><td className="text-right font-medium">{formatCur(computation.breakdown[3].taxable)}</td></tr>

                  <tr className="bg-gray-50 border-y-2 border-gray-800 font-bold text-base mt-4">
                    <td className="py-3 pl-2">Gross Total Income</td>
                    <td className="text-right">{formatCur(grossTotalIncome)}</td>
                  </tr>

                  {totalDeductions > 0 && (
                    <>
                      <tr><td className="py-2 font-semibold pt-4 text-red-600">Less: Chapter VI-A Deductions</td><td className="text-right font-medium"></td></tr>
                      {data.deductions.sec80CCD2 > 0 && <tr><td className="pl-6 py-1 text-gray-600">Sec 80CCD(2) - Employer NPS</td><td className="text-right text-red-600">- {formatCur(data.deductions.sec80CCD2)}</td></tr>}
                      {data.deductions.sec80CCH > 0 && <tr><td className="pl-6 py-1 text-gray-600">Sec 80CCH - Agniveer</td><td className="text-right text-red-600">- {formatCur(data.deductions.sec80CCH)}</td></tr>}
                    </>
                  )}

                  <tr className="bg-gray-900 text-white font-bold text-lg mt-4">
                    <td className="py-3 pl-2">TOTAL NET INCOME</td>
                    <td className="text-right pr-2">{formatCur(totalIncome)}</td>
                  </tr>

                  {totalPrepaid > 0 && (
                    <>
                      <tr><td className="py-2 font-semibold pt-6 text-green-700">Prepaid Taxes (TDS/TCS/Advance)</td><td className="text-right font-bold text-green-700">{formatCur(totalPrepaid)}</td></tr>
                    </>
                  )}

                  {(data.exemptIncome.agriculture > 0 || data.exemptIncome.ppfInterest > 0 || data.exemptIncome.otherExempt > 0 || data.exemptIncome.insuranceMaturity > 0 || data.exemptIncome.npsWithdrawal > 0 || data.exemptIncome.pfMaturity > 0 || data.exemptIncome.hufShare > 0 || data.exemptIncome.ssyMaturity > 0 || data.otherSources.gifts.isExemptOccasion) && (
                    <>
                      <tr><td className="py-2 font-semibold pt-8 text-blue-700">Exempt Incomes (Not Taxable)</td><td className="text-right"></td></tr>
                      {data.exemptIncome.agriculture > 0 && <tr><td className="pl-6 py-1 text-gray-600">Agricultural Income</td><td className="text-right">{formatCur(data.exemptIncome.agriculture)}</td></tr>}
                      {data.exemptIncome.ppfInterest > 0 && <tr><td className="pl-6 py-1 text-gray-600">PPF / EPF Interest</td><td className="text-right">{formatCur(data.exemptIncome.ppfInterest)}</td></tr>}
                      {data.exemptIncome.insuranceMaturity > 0 && <tr><td className="pl-6 py-1 text-gray-600">Insurance Maturity</td><td className="text-right">{formatCur(data.exemptIncome.insuranceMaturity)}</td></tr>}
                      {data.exemptIncome.npsWithdrawal > 0 && <tr><td className="pl-6 py-1 text-gray-600">NPS/UPS Withdrawal</td><td className="text-right">{formatCur(data.exemptIncome.npsWithdrawal)}</td></tr>}
                      {data.exemptIncome.pfMaturity > 0 && <tr><td className="pl-6 py-1 text-gray-600">Provident Fund Maturity</td><td className="text-right">{formatCur(data.exemptIncome.pfMaturity)}</td></tr>}
                      {data.exemptIncome.hufShare > 0 && <tr><td className="pl-6 py-1 text-gray-600">Share from HUF</td><td className="text-right">{formatCur(data.exemptIncome.hufShare)}</td></tr>}
                      {data.exemptIncome.ssyMaturity > 0 && <tr><td className="pl-6 py-1 text-gray-600">SSY Maturity</td><td className="text-right">{formatCur(data.exemptIncome.ssyMaturity)}</td></tr>}
                      {data.exemptIncome.otherExempt > 0 && <tr><td className="pl-6 py-1 text-gray-600">Other Exempt Income</td><td className="text-right">{formatCur(data.exemptIncome.otherExempt)}</td></tr>}
                      {data.otherSources.gifts.isExemptOccasion && totalGifts > 0 && <tr><td className="pl-6 py-1 text-gray-600">Gifts Received (Exempt Occasion)</td><td className="text-right">{formatCur(totalGifts)}</td></tr>}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
              Generated by Finaarthika Tax Tool | Computed as per latest Income Tax Rules (FY 2025-26)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
