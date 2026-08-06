import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { useTaxation } from './TaxationContext';

const formatCur = (num) => {
  if (!num) return '0.00';
  return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function TaxDocumentGenerator({ onClose }) {
  const { taxData } = useTaxation();
  const documentRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const data = taxData;
  const { business } = data;

  // Math
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
  
  // Tax Math
  const taxUnder111A = taxableStcg * 0.20;
  const taxUnder112A = Math.max(0, taxableLtcg - 125000) * 0.125;
  const normalIncome = totalIncome - taxableStcg - taxableLtcg;
  let normalTax = 0;
  if (normalIncome > 1200000) { normalTax += (normalIncome - 1200000) * 0.20; }
  else if (normalIncome > 800000) { normalTax += (normalIncome - 800000) * 0.15; }
  else if (normalIncome > 400000) { normalTax += (normalIncome - 400000) * 0.05; }
  let totalTax = taxUnder111A + taxUnder112A + normalTax;
  let rebate87a = 0;
  if (totalIncome <= 1200000 && totalTax > 0) {
    rebate87a = totalTax; 
    totalTax = 0;
  }
  const healthEduCess = totalTax * 0.04;
  const grossTaxLiability = totalTax + healthEduCess;
  const taxDue = Math.max(0, grossTaxLiability - totalPrepaid);
  const taxRefund = Math.max(0, totalPrepaid - grossTaxLiability);

  const handleDownload = () => {
    setIsGenerating(true);
    const element = documentRef.current;
    const opt = {
      margin: 0,
      filename: `Tax_Computation_${data.clientDetails.pan || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 794 },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
      onClose();
    });
  };

  const PageHeader = ({ title, showClientDetails }) => (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-medium text-slate-800 tracking-tight">{title}</h1>
        </div>
        <div className="text-right">
          <p className="text-base text-slate-600 font-medium tracking-wide">Financial Year 2025-26</p>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Assessment Year 2026-27</p>
        </div>
      </div>
      
      {showClientDetails && (
        <div className="grid grid-cols-2 text-sm mb-8 border-y border-slate-200">
          <div className="py-3 pr-4 border-r border-slate-200">
            <span className="text-slate-500 font-medium inline-block w-24">Name</span>
            <span className="text-slate-900 font-medium uppercase">{data.clientDetails.firstName} {data.clientDetails.lastName || ''}</span>
          </div>
          <div className="py-3 pl-4">
            <span className="text-slate-500 font-medium inline-block w-24">PAN</span>
            <span className="text-slate-900 font-medium uppercase">{data.clientDetails.pan || 'N/A'}</span>
          </div>
        </div>
      )}
    </>
  );

  const PageFooter = ({ pageNum, totalPages }) => (
    <div className="absolute bottom-6 left-12 right-12 flex justify-between items-center text-[10px] text-slate-400 font-medium mt-auto">
      <p>© 2025, Finaarthika Tax Engine. All rights reserved.</p>
      <p>Page {pageNum} of {totalPages}</p>
    </div>
  );

  const TableHeader = () => (
    <thead>
      <tr className="bg-[#f8f9fa] border-y border-slate-200">
        <th className="py-3 px-4 text-left font-bold text-slate-700 text-sm w-3/5">Particulars</th>
        <th className="py-3 px-4 text-right font-bold text-slate-700 text-sm w-1/5">Amount</th>
        <th className="py-3 px-4 text-right font-bold text-slate-700 text-sm w-1/5">Total</th>
      </tr>
    </thead>
  );

  const totalPages = data.incomes.hasBusiness ? 3 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-4xl w-full shadow-2xl relative my-8">
        
        {/* Actions */}
        <div className="sticky top-0 bg-[#121212] z-10 border-b border-gray-800 p-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Document Preview</h2>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleDownload} disabled={isGenerating} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              {isGenerating ? 'Generating PDF...' : 'Download Premium PDF'}
            </button>
          </div>
        </div>

        {/* PDF Container - A4 size strict rendering at 96 DPI: 794px x 1123px per page */}
        <div className="overflow-x-auto bg-gray-900 flex justify-center py-8">
          <div ref={documentRef} className="flex flex-col bg-slate-200 gap-y-4" style={{ width: '794px' }}>
            
            {/* PAGE 1: Income Computation */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden">
              <PageHeader title="Tax Computation" showClientDetails={true} />
              
              <table className="w-full text-sm border-collapse">
                <TableHeader />
                <tbody className="divide-y divide-slate-100">
                  {data.incomes.hasBusiness && (
                    <>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-800">Income from Business (Annexure #1)</td>
                        <td className="py-3 px-4 text-right"></td>
                        <td className="py-3 px-4 text-right font-medium">{formatCur(taxableBusiness)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 pl-8 text-slate-600">Section 44AD Presumptive</td>
                        <td className="py-2 px-4 text-right">{formatCur(taxableBusiness)}</td>
                        <td className="py-2 px-4 text-right"></td>
                      </tr>
                    </>
                  )}
                  {data.incomes.hasCapitalGains && (
                    <>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-800">Income from Capital Gains</td>
                        <td className="py-3 px-4 text-right"></td>
                        <td className="py-3 px-4 text-right font-medium">{formatCur(taxableStcg + taxableLtcg)}</td>
                      </tr>
                      {taxableStcg > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Short-Term Capital Gains u/s 111A</td><td className="py-2 px-4 text-right">{formatCur(taxableStcg)}</td><td className="py-2 px-4"></td></tr>}
                      {taxableLtcg > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Long-Term Capital Gains u/s 112A</td><td className="py-2 px-4 text-right">{formatCur(taxableLtcg)}</td><td className="py-2 px-4"></td></tr>}
                    </>
                  )}
                  {data.incomes.hasOtherSources && (
                    <>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-800">Income from Other Sources (Annexure #2)</td>
                        <td className="py-3 px-4 text-right"></td>
                        <td className="py-3 px-4 text-right font-medium">{formatCur(grossOther)}</td>
                      </tr>
                    </>
                  )}
                  <tr className="bg-[#f8f9fa] border-y border-slate-200">
                    <td className="py-3 px-4 font-bold text-slate-800">Gross Total Income</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(grossTotalIncome)}</td>
                  </tr>
                  
                  {totalDeductions > 0 && (
                    <>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-800">Less: Deductions</td>
                        <td className="py-3 px-4 text-right"></td>
                        <td className="py-3 px-4 text-right font-medium">{formatCur(totalDeductions)}</td>
                      </tr>
                      {data.deductions.sec80CCD2 > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Sec 80CCD(2)</td><td className="py-2 px-4 text-right">{formatCur(data.deductions.sec80CCD2)}</td><td className="py-2 px-4"></td></tr>}
                      {data.deductions.sec80CCH > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Sec 80CCH</td><td className="py-2 px-4 text-right">{formatCur(data.deductions.sec80CCH)}</td><td className="py-2 px-4"></td></tr>}
                    </>
                  )}

                  <tr className="bg-[#f8f9fa] border-y border-slate-200">
                    <td className="py-3 px-4 font-bold text-slate-800">Taxable Total Income</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(totalIncome)}</td>
                  </tr>

                  <tr><td colSpan="3" className="py-6 border-none"></td></tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Tax Payable</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-medium">{formatCur(taxUnder111A + taxUnder112A + normalTax)}</td>
                  </tr>
                  {normalTax > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Tax Payable at Normal Rate</td><td className="py-2 px-4 text-right">{formatCur(normalTax)}</td><td className="py-2 px-4"></td></tr>}
                  {taxUnder111A > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Tax Payable at Special Rate (111A)</td><td className="py-2 px-4 text-right">{formatCur(taxUnder111A)}</td><td className="py-2 px-4"></td></tr>}
                  {taxUnder112A > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Tax Payable at Special Rate (112A)</td><td className="py-2 px-4 text-right">{formatCur(taxUnder112A)}</td><td className="py-2 px-4"></td></tr>}
                  
                  {rebate87a > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800">Rebate u/s 87A</td>
                      <td className="py-3 px-4 text-right"></td>
                      <td className="py-3 px-4 text-right font-medium">{formatCur(rebate87a)}</td>
                    </tr>
                  )}

                  <tr className="bg-[#f8f9fa] border-y border-slate-200">
                    <td className="py-3 px-4 font-bold text-slate-800">Gross Tax Liability</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(grossTaxLiability)}</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Less: Total Taxes Paid</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-medium">{formatCur(totalPrepaid)}</td>
                  </tr>
                  {data.prepaidTaxes.tdsSalary > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">TDS Salary</td><td className="py-2 px-4 text-right">{formatCur(data.prepaidTaxes.tdsSalary)}</td><td className="py-2 px-4"></td></tr>}
                  {data.prepaidTaxes.tdsOther > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">TDS Other</td><td className="py-2 px-4 text-right">{formatCur(data.prepaidTaxes.tdsOther)}</td><td className="py-2 px-4"></td></tr>}
                  {data.prepaidTaxes.advanceTax > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">Advance Tax</td><td className="py-2 px-4 text-right">{formatCur(data.prepaidTaxes.advanceTax)}</td><td className="py-2 px-4"></td></tr>}
                  {data.prepaidTaxes.tcs > 0 && <tr><td className="py-2 px-4 pl-8 text-slate-600">TCS</td><td className="py-2 px-4 text-right">{formatCur(data.prepaidTaxes.tcs)}</td><td className="py-2 px-4"></td></tr>}

                  <tr className="bg-[#f8f9fa] border-y border-slate-200">
                    <td className="py-3 px-4 font-bold text-slate-800">{taxRefund > 0 ? 'Refund Due' : 'Tax Dues'}</td>
                    <td className="py-3 px-4 text-right"></td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(taxRefund > 0 ? taxRefund : taxDue)}</td>
                  </tr>
                </tbody>
              </table>

              <PageFooter pageNum={1} totalPages={totalPages} />
            </div>

            {/* PAGE 2: Balance Sheet */}
            {data.incomes.hasBusiness && (
              <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden">
                <PageHeader title="Balance Sheet" showClientDetails={false} />
                
                <p className="text-sm font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Balance Sheet as of 31st March 2026</p>
                <table className="w-full text-sm border-collapse">
                  <TableHeader />
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-[#f8f9fa]"><td colSpan="3" className="py-3 px-4 font-bold text-slate-800 border-y border-slate-200">Equity & Liabilities</td></tr>
                    
                    <tr><td className="py-3 px-4 font-semibold text-slate-800">Equity</td><td className="py-3 px-4 text-right"></td><td className="py-3 px-4 text-right font-medium">₹{formatCur(Number(business.balanceSheet.equityCapital) + Number(business.balanceSheet.equityReserves))}</td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Proprietor's Capital</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.equityCapital)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Reserves & Surplus</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.equityReserves)}</td><td className="py-2 px-4"></td></tr>

                    <tr><td className="py-3 px-4 font-semibold text-slate-800">Non-Current Liabilities</td><td className="py-3 px-4 text-right"></td><td className="py-3 px-4 text-right font-medium">₹{formatCur(Number(business.balanceSheet.nonCurrentSecured) + Number(business.balanceSheet.nonCurrentUnsecured) + Number(business.balanceSheet.nonCurrentAdvances))}</td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Secured Loans</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.nonCurrentSecured)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Unsecured Loans</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.nonCurrentUnsecured)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Advances</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.nonCurrentAdvances)}</td><td className="py-2 px-4"></td></tr>

                    <tr><td className="py-3 px-4 font-semibold text-slate-800">Current Liabilities</td><td className="py-3 px-4 text-right"></td><td className="py-3 px-4 text-right font-medium">₹{formatCur(Number(business.balanceSheet.currentPayables) + Number(business.balanceSheet.currentProvisions) + Number(business.balanceSheet.currentOtherLiab))}</td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Payables</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentPayables)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Provisions for Expenses</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentProvisions)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Other Current Liabilities</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentOtherLiab)}</td><td className="py-2 px-4"></td></tr>
                    
                    {(() => {
                      const totalLiabilities = Number(business.balanceSheet.equityCapital) + Number(business.balanceSheet.equityReserves) +
                        Number(business.balanceSheet.nonCurrentSecured) + Number(business.balanceSheet.nonCurrentUnsecured) + Number(business.balanceSheet.nonCurrentAdvances) +
                        Number(business.balanceSheet.currentPayables) + Number(business.balanceSheet.currentProvisions) + Number(business.balanceSheet.currentOtherLiab);
                      return (
                        <tr className="bg-[#f8f9fa] border-y border-slate-200">
                          <td className="py-3 px-4 font-bold text-slate-800">Total Equity & Liabilities</td>
                          <td className="py-3 px-4 text-right"></td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(totalLiabilities)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
                <PageFooter pageNum={2} totalPages={totalPages} />
              </div>
            )}

            {/* PAGE 3: Balance Sheet (Assets) & Annexures */}
            {data.incomes.hasBusiness && (
              <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden">
                <PageHeader title="Balance Sheet (Cont.)" showClientDetails={false} />
                
                <table className="w-full text-sm border-collapse mb-10">
                  <TableHeader />
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-[#f8f9fa]"><td colSpan="3" className="py-3 px-4 font-bold text-slate-800 border-y border-slate-200">Assets</td></tr>
                    
                    <tr><td className="py-3 px-4 font-semibold text-slate-800">Fixed Assets</td><td className="py-3 px-4 text-right"></td><td className="py-3 px-4 text-right font-medium">₹{formatCur(Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation))}</td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Net Block</td><td className="py-2 px-4 text-right">{formatCur(Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation))}</td><td className="py-2 px-4"></td></tr>

                    <tr><td className="py-3 px-4 font-semibold text-slate-800">Investments</td><td className="py-3 px-4 text-right"></td><td className="py-3 px-4 text-right font-medium">₹{formatCur(Number(business.balanceSheet.investmentsST) + Number(business.balanceSheet.investmentsLT))}</td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Short Term Investments</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.investmentsST)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Long Term Investments</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.investmentsLT)}</td><td className="py-2 px-4"></td></tr>

                    <tr><td className="py-3 px-4 font-semibold text-slate-800">Current Assets</td><td className="py-3 px-4 text-right"></td><td className="py-3 px-4 text-right font-medium">₹{formatCur(Number(business.balanceSheet.currentBank) + Number(business.balanceSheet.currentCash) + Number(business.balanceSheet.currentStock) + Number(business.balanceSheet.currentReceivables) + Number(business.balanceSheet.currentLoansGiven) + Number(business.balanceSheet.currentOther))}</td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Bank Balance</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentBank)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Cash Balance</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentCash)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Closing Stock</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentStock)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Receivables</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentReceivables)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Loans and Advances</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentLoansGiven)}</td><td className="py-2 px-4"></td></tr>
                    <tr><td className="py-2 px-4 pl-8 text-slate-600">Other Current Assets</td><td className="py-2 px-4 text-right">{formatCur(business.balanceSheet.currentOther)}</td><td className="py-2 px-4"></td></tr>
                    
                    {(() => {
                      const totalAssets = (Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation)) +
                        Number(business.balanceSheet.investmentsST) + Number(business.balanceSheet.investmentsLT) +
                        Number(business.balanceSheet.currentBank) + Number(business.balanceSheet.currentCash) + Number(business.balanceSheet.currentStock) +
                        Number(business.balanceSheet.currentReceivables) + Number(business.balanceSheet.currentLoansGiven) + Number(business.balanceSheet.currentOther);
                      return (
                        <tr className="bg-[#f8f9fa] border-y border-slate-200">
                          <td className="py-3 px-4 font-bold text-slate-800">Total Assets</td>
                          <td className="py-3 px-4 text-right"></td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(totalAssets)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
                
                {data.incomes.hasOtherSources && (
                  <>
                    <h3 className="text-base font-medium text-slate-800 mb-2">Income from Other Sources (Annexure #2)</h3>
                    <table className="w-full text-sm border-collapse mb-10">
                      <TableHeader />
                      <tbody className="divide-y divide-slate-100">
                        {data.otherSources.savingsInterest > 0 && <tr><td className="py-2 px-4 text-slate-700">Saving Bank Interest</td><td className="py-2 px-4 text-right">{formatCur(data.otherSources.savingsInterest)}</td><td className="py-2 px-4"></td></tr>}
                        {data.otherSources.fdInterest > 0 && <tr><td className="py-2 px-4 text-slate-700">Interest on Fixed Deposit</td><td className="py-2 px-4 text-right">{formatCur(data.otherSources.fdInterest)}</td><td className="py-2 px-4"></td></tr>}
                        {dividendSum > 0 && <tr><td className="py-2 px-4 text-slate-700">Dividend Income</td><td className="py-2 px-4 text-right">{formatCur(dividendSum)}</td><td className="py-2 px-4"></td></tr>}
                        {taxableGifts > 0 && <tr><td className="py-2 px-4 text-slate-700">Taxable Gifts</td><td className="py-2 px-4 text-right">{formatCur(taxableGifts)}</td><td className="py-2 px-4"></td></tr>}
                        {data.otherSources.anyOtherIncome > 0 && (
                          <tr>
                            <td className="py-2 px-4 text-slate-700">
                              Other Taxable Income
                              {data.otherSources.anyOtherIncomeNarration && <span className="block text-xs text-slate-500">Note: {data.otherSources.anyOtherIncomeNarration}</span>}
                            </td>
                            <td className="py-2 px-4 text-right">{formatCur(data.otherSources.anyOtherIncome)}</td>
                            <td className="py-2 px-4"></td>
                          </tr>
                        )}
                        <tr className="bg-[#f8f9fa] border-y border-slate-200">
                          <td className="py-3 px-4 font-bold text-slate-800">Total Taxable Income</td>
                          <td className="py-3 px-4 text-right"></td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(grossOther)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {data.incomes.hasExemptIncome && (
                  <>
                    <h3 className="text-base font-medium text-slate-800 mb-2">Exempt Income (Annexure #3)</h3>
                    <table className="w-full text-sm border-collapse mb-10">
                      <TableHeader />
                      <tbody className="divide-y divide-slate-100">
                        {data.exemptIncome.agriculture > 0 && <tr><td className="py-2 px-4 text-slate-700">Agricultural income</td><td className="py-2 px-4 text-right">{formatCur(data.exemptIncome.agriculture)}</td><td className="py-2 px-4"></td></tr>}
                        {data.exemptIncome.insuranceMaturity > 0 && <tr><td className="py-2 px-4 text-slate-700">Insurance Maturity</td><td className="py-2 px-4 text-right">{formatCur(data.exemptIncome.insuranceMaturity)}</td><td className="py-2 px-4"></td></tr>}
                        {data.otherSources.gifts.isExemptOccasion && totalGifts > 0 && (
                          <tr>
                            <td className="py-2 px-4 text-slate-700">
                              Gifts Received on Specific Occasion
                              {data.otherSources.gifts.exemptGiftNarration && <span className="block text-xs text-slate-500">Occasion: {data.otherSources.gifts.exemptGiftNarration}</span>}
                            </td>
                            <td className="py-2 px-4 text-right">{formatCur(totalGifts)}</td><td className="py-2 px-4"></td>
                          </tr>
                        )}
                        <tr className="bg-[#f8f9fa] border-y border-slate-200">
                          <td className="py-3 px-4 font-bold text-slate-800">Total Exempt Income</td>
                          <td className="py-3 px-4 text-right"></td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{formatCur(data.exemptIncome.agriculture + data.exemptIncome.insuranceMaturity + (data.otherSources.gifts.isExemptOccasion ? totalGifts : 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
                
                <PageFooter pageNum={3} totalPages={totalPages} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
