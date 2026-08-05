import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { useTaxation } from './TaxationContext';

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
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: `Tax_Computation_${data.clientDetails.pan || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', avoid: '.no-break' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
      onClose();
    });
  };

  const ClientHeader = () => (
    <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 border border-slate-200 rounded-lg p-5">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Client Name</p>
        <p className="font-semibold text-base text-slate-900">{data.clientDetails.firstName} {data.clientDetails.lastName || 'Client'}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">PAN Number</p>
        <p className="font-semibold text-base text-slate-900 uppercase">{data.clientDetails.pan || 'NOT PROVIDED'}</p>
      </div>
    </div>
  );

  const totalPages = data.incomes.hasBusiness ? 3 : 1;

  const PageTemplate = ({ title, pageNum, children, isLast = false }) => (
    <div className="bg-white text-slate-900 mx-auto" style={{ width: '190mm', padding: '10px', pageBreakAfter: isLast ? 'auto' : 'always' }}>
      {/* Header */}
      <div className="flex justify-between items-end border-b-[3px] border-indigo-900 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 uppercase tracking-widest" style={{ fontFamily: 'sans-serif' }}>Finaarthika</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Income Tax Statement</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">FY 2025-26 | AY 2026-27</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="min-h-[220mm]">
        {pageNum === 1 && <ClientHeader />}
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        <p>Generated securely via Finaarthika Tax Engine</p>
        <p>Page {pageNum} of {totalPages}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-4xl w-full shadow-2xl relative my-8">
        
        {/* Header Actions */}
        <div className="sticky top-0 bg-[#121212] z-10 border-b border-gray-800 p-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Document Preview</h2>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleDownload} disabled={isGenerating} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold tracking-wide rounded-lg transition-colors flex items-center gap-2">
              {isGenerating ? 'Generating PDF...' : 'Download Premium PDF'}
            </button>
          </div>
        </div>

        {/* Hidden Container for PDF generation */}
        <div className="overflow-x-auto p-8 bg-gray-900 flex justify-center">
          <div ref={documentRef} className="bg-white p-4">
            
            {/* PAGE 1: P&L */}
            {data.incomes.hasBusiness && (
              <PageTemplate title="Part A: Profit & Loss Statement" pageNum={1}>
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Sec 44AD Presumptive Business</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td colSpan="2" className="px-6 pt-6 pb-2 font-bold text-slate-900">1. Gross Receipts / Turnover</td></tr>
                      <tr><td className="px-6 py-2 text-slate-600 pl-10">Via Banking Channels</td><td className="px-6 py-2 text-right font-medium">{formatCur(business.turnoverBank)}</td></tr>
                      <tr><td className="px-6 py-2 text-slate-600 pl-10">Via Cash / Other Modes</td><td className="px-6 py-2 text-right font-medium">{formatCur(business.turnoverCash)}</td></tr>
                      <tr className="border-t border-slate-100 bg-slate-50/50"><td className="px-6 py-3 font-bold text-slate-900 pl-10">Total Gross Receipts</td><td className="px-6 py-3 text-right font-bold text-slate-900">{formatCur(Number(business.turnoverBank) + Number(business.turnoverCash))}</td></tr>
                      
                      <tr><td colSpan="2" className="px-6 pt-8 pb-2 font-bold text-slate-900">2. Presumptive Profit Declared</td></tr>
                      <tr><td className="px-6 py-2 text-slate-600 pl-10">On Banking Turnover</td><td className="px-6 py-2 text-right font-medium">{formatCur(business.profitBank)}</td></tr>
                      <tr><td className="px-6 py-2 text-slate-600 pl-10">On Cash Turnover</td><td className="px-6 py-2 text-right font-medium">{formatCur(business.profitCash)}</td></tr>
                      <tr className="border-t-2 border-indigo-100 bg-indigo-50/50">
                        <td className="px-6 py-4 font-black text-indigo-950 pl-10 text-base">Net Taxable Business Profit</td>
                        <td className="px-6 py-4 text-right font-black text-indigo-900 text-base">{formatCur(grossBusiness)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </PageTemplate>
            )}

            {/* PAGE 2: Balance Sheet */}
            {data.incomes.hasBusiness && (
              <PageTemplate title="Part B: Balance Sheet" pageNum={2}>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest text-right">As on 31st March 2026</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  {/* Liabilities */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm h-fit">
                    <div className="bg-rose-50 px-5 py-3 border-b border-rose-100">
                      <h4 className="font-bold text-rose-900 uppercase tracking-wider text-sm">Liabilities</h4>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td colSpan="2" className="px-5 pt-4 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Equity</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Proprietor's Capital</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.equityCapital)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Reserves & Surplus</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.equityReserves)}</td></tr>
                        
                        <tr><td colSpan="2" className="px-5 pt-4 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-50 mt-2">Non-Current Liabilities</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Secured Loans</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.nonCurrentSecured)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Unsecured Loans</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.nonCurrentUnsecured)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Advances</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.nonCurrentAdvances)}</td></tr>

                        <tr><td colSpan="2" className="px-5 pt-4 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-50 mt-2">Current Liabilities</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Sundry Creditors</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentPayables)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Provisions</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentProvisions)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700 pb-4">Other Liabilities</td><td className="px-5 py-1.5 text-right font-medium pb-4">{formatCur(business.balanceSheet.currentOtherLiab)}</td></tr>
                        
                        <tr className="bg-rose-50/50 border-t border-rose-100">
                          <td className="px-5 py-4 font-bold text-rose-900">Total Liabilities</td>
                          <td className="px-5 py-4 text-right font-black text-rose-900">{formatCur(
                            Number(business.balanceSheet.equityCapital) + Number(business.balanceSheet.equityReserves) +
                            Number(business.balanceSheet.nonCurrentSecured) + Number(business.balanceSheet.nonCurrentUnsecured) + Number(business.balanceSheet.nonCurrentAdvances) +
                            Number(business.balanceSheet.currentPayables) + Number(business.balanceSheet.currentProvisions) + Number(business.balanceSheet.currentOtherLiab)
                          )}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Assets */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm h-fit">
                    <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                      <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-sm">Assets</h4>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td colSpan="2" className="px-5 pt-4 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Fixed Assets</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Net Block</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation))}</td></tr>
                        
                        <tr><td colSpan="2" className="px-5 pt-4 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-50 mt-2">Investments</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Short Term</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.investmentsST)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Long Term</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.investmentsLT)}</td></tr>
                        
                        <tr><td colSpan="2" className="px-5 pt-4 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-50 mt-2">Current Assets</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Bank Balance</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentBank)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Cash Balance</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentCash)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Stock / Inventory</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentStock)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Sundry Debtors</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentReceivables)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700">Loans Given</td><td className="px-5 py-1.5 text-right font-medium">{formatCur(business.balanceSheet.currentLoansGiven)}</td></tr>
                        <tr><td className="px-5 py-1.5 text-slate-700 pb-4">Other Current Assets</td><td className="px-5 py-1.5 text-right font-medium pb-4">{formatCur(business.balanceSheet.currentOther)}</td></tr>
                        
                        <tr className="bg-emerald-50/50 border-t border-emerald-100">
                          <td className="px-5 py-4 font-bold text-emerald-900">Total Assets</td>
                          <td className="px-5 py-4 text-right font-black text-emerald-900">{formatCur(
                            (Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation)) +
                            Number(business.balanceSheet.investmentsST) + Number(business.balanceSheet.investmentsLT) +
                            Number(business.balanceSheet.currentBank) + Number(business.balanceSheet.currentCash) + Number(business.balanceSheet.currentStock) +
                            Number(business.balanceSheet.currentReceivables) + Number(business.balanceSheet.currentLoansGiven) + Number(business.balanceSheet.currentOther)
                          )}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </PageTemplate>
            )}

            {/* PAGE 3: Computation */}
            <PageTemplate title={`Part ${data.incomes.hasBusiness ? 'C' : 'A'}: Computation of Income`} pageNum={totalPages} isLast={true}>
              
              {!data.incomes.hasBusiness && <ClientHeader />}

              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-800 uppercase tracking-wider text-xs">Head of Income</th>
                      <th className="px-6 py-4 font-bold text-slate-800 uppercase tracking-wider text-xs text-right">Taxable Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="no-break"><td className="px-6 py-4 font-bold text-slate-900">1. Business & Profession</td><td className="px-6 py-4 text-right font-semibold">{formatCur(computation.breakdown[0].taxable)}</td></tr>
                    
                    <tr className="no-break"><td className="px-6 pt-4 pb-1 font-bold text-slate-900">2. Capital Gains</td><td className="px-6 pt-4 pb-1 text-right font-semibold"></td></tr>
                    <tr className="no-break"><td className="px-6 py-1.5 text-slate-600 pl-10">Short-Term Capital Gains</td><td className="px-6 py-1.5 text-right font-medium">{formatCur(computation.breakdown[1].taxable)}</td></tr>
                    <tr className="no-break"><td className="px-6 py-1.5 text-slate-600 pl-10 pb-4">Long-Term Capital Gains</td><td className="px-6 py-1.5 text-right font-medium pb-4">{formatCur(computation.breakdown[2].taxable)}</td></tr>

                    <tr className="no-break"><td className="px-6 py-4 font-bold text-slate-900">3. Income from Other Sources</td><td className="px-6 py-4 text-right font-semibold">{formatCur(computation.breakdown[3].taxable)}</td></tr>

                    <tr className="bg-slate-50 border-y-2 border-slate-200 no-break">
                      <td className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider">Gross Total Income</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-base">{formatCur(grossTotalIncome)}</td>
                    </tr>

                    {totalDeductions > 0 && (
                      <>
                        <tr className="no-break"><td className="px-6 pt-4 pb-1 font-bold text-rose-700">Less: Chapter VI-A Deductions</td><td className="px-6 pt-4 pb-1 text-right font-semibold"></td></tr>
                        {data.deductions.sec80CCD2 > 0 && <tr className="no-break"><td className="px-6 py-1.5 text-slate-600 pl-10">Sec 80CCD(2) - Employer NPS</td><td className="px-6 py-1.5 text-right font-medium text-rose-600">- {formatCur(data.deductions.sec80CCD2)}</td></tr>}
                        {data.deductions.sec80CCH > 0 && <tr className="no-break"><td className="px-6 py-1.5 text-slate-600 pl-10 pb-4">Sec 80CCH - Agniveer</td><td className="px-6 py-1.5 text-right font-medium text-rose-600 pb-4">- {formatCur(data.deductions.sec80CCH)}</td></tr>}
                      </>
                    )}

                    <tr className="bg-indigo-950 border-y border-indigo-900 no-break">
                      <td className="px-6 py-5 font-black text-white uppercase tracking-widest text-lg">TOTAL NET INCOME</td>
                      <td className="px-6 py-5 text-right font-black text-white text-xl">{formatCur(totalIncome)}</td>
                    </tr>

                    {totalPrepaid > 0 && (
                      <tr className="no-break bg-emerald-50/50">
                        <td className="px-6 py-5 font-bold text-emerald-800">Prepaid Taxes (TDS / TCS / Advance)</td>
                        <td className="px-6 py-5 text-right font-black text-emerald-700 text-lg">{formatCur(totalPrepaid)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(data.exemptIncome.agriculture > 0 || data.exemptIncome.ppfInterest > 0 || data.exemptIncome.otherExempt > 0 || data.exemptIncome.insuranceMaturity > 0 || data.exemptIncome.npsWithdrawal > 0 || data.exemptIncome.pfMaturity > 0 || data.exemptIncome.hufShare > 0 || data.exemptIncome.ssyMaturity > 0 || data.otherSources.gifts.isExemptOccasion) && (
                <div className="mt-8 rounded-xl border border-slate-200 overflow-hidden shadow-sm no-break">
                  <div className="bg-sky-50 px-6 py-4 border-b border-sky-100">
                    <h4 className="font-bold text-sky-900 uppercase tracking-wider text-sm">Exempt Incomes (Not Taxable)</h4>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {data.exemptIncome.agriculture > 0 && <tr><td className="px-6 py-3 text-slate-700">Agricultural Income</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.agriculture)}</td></tr>}
                      {data.exemptIncome.ppfInterest > 0 && <tr><td className="px-6 py-3 text-slate-700">PPF / EPF Interest</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.ppfInterest)}</td></tr>}
                      {data.exemptIncome.insuranceMaturity > 0 && <tr><td className="px-6 py-3 text-slate-700">Insurance Maturity</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.insuranceMaturity)}</td></tr>}
                      {data.exemptIncome.npsWithdrawal > 0 && <tr><td className="px-6 py-3 text-slate-700">NPS/UPS Withdrawal</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.npsWithdrawal)}</td></tr>}
                      {data.exemptIncome.pfMaturity > 0 && <tr><td className="px-6 py-3 text-slate-700">Provident Fund Maturity</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.pfMaturity)}</td></tr>}
                      {data.exemptIncome.hufShare > 0 && <tr><td className="px-6 py-3 text-slate-700">Share from HUF</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.hufShare)}</td></tr>}
                      {data.exemptIncome.ssyMaturity > 0 && <tr><td className="px-6 py-3 text-slate-700">SSY Maturity</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.ssyMaturity)}</td></tr>}
                      {data.exemptIncome.otherExempt > 0 && <tr><td className="px-6 py-3 text-slate-700">Other Exempt Income</td><td className="px-6 py-3 text-right font-medium">{formatCur(data.exemptIncome.otherExempt)}</td></tr>}
                      {data.otherSources.gifts.isExemptOccasion && totalGifts > 0 && <tr><td className="px-6 py-3 text-slate-700">Gifts Received (Exempt Occasion)</td><td className="px-6 py-3 text-right font-medium">{formatCur(totalGifts)}</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </PageTemplate>

          </div>
        </div>
      </div>
    </div>
  );
}
