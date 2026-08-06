import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { useTaxation } from './TaxationContext';

const formatCur = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN');
};

export default function TaxDocumentGenerator({ onClose }) {
  const { taxData } = useTaxation();
  const documentRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const data = taxData;
  const { business } = data;
  const bankAccounts = data.bankAccounts || [];
  const cgTransactions = data.cgTransactions || [];

  // -- MATH COMPUTATIONS --
  const grossBusiness = Number(business.profitBank) + Number(business.profitCash);
  const grossStcg = Object.values(data.capitalGains.stcg).reduce((sum, val) => sum + Number(val), 0);
  const grossLtcg = Object.values(data.capitalGains.ltcg).reduce((sum, val) => sum + Number(val), 0);
  const dividendSum = Object.values(data.otherSources.dividend).reduce((sum, val) => sum + Number(val), 0);
  
  const totalGifts = Number(data.otherSources.gifts.monetary) + Number(data.otherSources.gifts.movable) + Number(data.otherSources.gifts.immovable);
  const taxableGifts = (!data.otherSources.gifts.isExemptOccasion && totalGifts > 50000) ? totalGifts : 0;
  const exemptGifts = (data.otherSources.gifts.isExemptOccasion && totalGifts > 0) ? totalGifts : 0;

  const familyPensionDeduction = Math.min(Number(data.otherSources.familyPension) * 0.3333, 15000);
  const taxableFamilyPension = Math.max(0, Number(data.otherSources.familyPension) - familyPensionDeduction);

  const grossOther = Number(data.otherSources.savingsInterest) + Number(data.otherSources.fdInterest) + 
                     Number(data.otherSources.taxRefundInterest) + Number(data.otherSources.bondsInterest) +
                     Number(data.otherSources.epfInterest) + Number(data.otherSources.loansInterest) +
                     Number(data.otherSources.anyOtherIncome) + dividendSum + taxableGifts + taxableFamilyPension;

  const totalExemptIncome = Number(data.exemptIncome.agriculture) + Number(data.exemptIncome.insuranceMaturity) +
                            Number(data.exemptIncome.ppfInterest) + Number(data.exemptIncome.npsWithdrawal) +
                            Number(data.exemptIncome.pfMaturity) + Number(data.exemptIncome.hufShare) +
                            Number(data.exemptIncome.ssyMaturity) + Number(data.exemptIncome.otherExempt) + exemptGifts;

  const taxableBusiness = Math.max(0, grossBusiness - Number(data.bfla.businessLoss));
  let remainingStcgLoss = Number(data.bfla.stcgLoss);
  const taxableStcg = Math.max(0, grossStcg - remainingStcgLoss);
  remainingStcgLoss = Math.max(0, remainingStcgLoss - grossStcg);
  const taxableLtcg = Math.max(0, grossLtcg - Number(data.bfla.ltcgLoss) - remainingStcgLoss);
  
  const grossTotalIncome = taxableBusiness + taxableStcg + taxableLtcg + grossOther;
  const totalDeductions = Number(data.deductions.sec80CCD2) + Number(data.deductions.sec80CCH);
  const totalIncome = Math.max(0, grossTotalIncome - totalDeductions);
  const totalPrepaid = Number(data.prepaidTaxes.advanceTax) + Number(data.prepaidTaxes.tdsSalary) + Number(data.prepaidTaxes.tdsOther) + Number(data.prepaidTaxes.tcs);
  
  const taxUnder111A = taxableStcg * 0.20;
  const taxUnder112A = Math.max(0, taxableLtcg - 125000) * 0.125;
  const normalIncome = Math.max(0, totalIncome - taxableStcg - taxableLtcg);
  let normalTax = 0;
  if (normalIncome > 1500000) { normalTax += (normalIncome - 1500000) * 0.30; }
  if (normalIncome > 1200000) { normalTax += (Math.min(normalIncome, 1500000) - 1200000) * 0.20; }
  if (normalIncome > 1000000) { normalTax += (Math.min(normalIncome, 1200000) - 1000000) * 0.15; }
  if (normalIncome > 700000) { normalTax += (Math.min(normalIncome, 1000000) - 700000) * 0.10; }
  if (normalIncome > 300000) { normalTax += (Math.min(normalIncome, 700000) - 300000) * 0.05; }
  
  let totalTax = taxUnder111A + taxUnder112A + normalTax;
  let rebate87a = 0;
  if (totalIncome <= 1200000) {
    rebate87a = normalTax; 
  }
  const taxAfterRebate = Math.max(0, totalTax - rebate87a);
  const healthEduCess = taxAfterRebate * 0.04;
  const grossTaxLiability = Math.round(taxAfterRebate + healthEduCess);
  const taxDue = Math.max(0, grossTaxLiability - totalPrepaid);
  const taxRefund = Math.max(0, totalPrepaid - grossTaxLiability);

  // Balance Sheet Totals
  const bsFixedNet = Number(business.balanceSheet.fixedGrossBlock) - Number(business.balanceSheet.fixedDepreciation);
  const bsInvest = Number(business.balanceSheet.investmentsST) + Number(business.balanceSheet.investmentsLT);
  const bsCurrentAssets = Number(business.balanceSheet.currentBank) + Number(business.balanceSheet.currentCash) + Number(business.balanceSheet.currentStock) + Number(business.balanceSheet.currentReceivables) + Number(business.balanceSheet.currentLoansGiven) + Number(business.balanceSheet.currentOther);
  const bsTotalAssets = bsFixedNet + bsInvest + bsCurrentAssets;

  const bsEquity = Number(business.balanceSheet.equityCapital) + Number(business.balanceSheet.equityReserves);
  const bsNonCurrentLiab = Number(business.balanceSheet.nonCurrentSecured) + Number(business.balanceSheet.nonCurrentUnsecured) + Number(business.balanceSheet.nonCurrentAdvances);
  const bsCurrentLiab = Number(business.balanceSheet.currentPayables) + Number(business.balanceSheet.currentProvisions) + Number(business.balanceSheet.currentOtherLiab);
  const bsTotalLiab = bsEquity + bsNonCurrentLiab + bsCurrentLiab;

  const totalPages = (data.incomes.hasBusiness ? 5 : 3) + (cgTransactions.length > 0 ? Math.ceil(cgTransactions.length / 10) : 0);

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

  // Tax2Win Premium Styling Components
  const PageWrapper = ({ children, pageNum }) => (
    <div className="bg-white w-[794px] h-[1123px] relative px-14 pt-16 pb-24 border-b border-gray-300">
      {children}
      <div className="absolute bottom-10 left-14 right-14 flex justify-between items-center text-[10px] text-gray-400">
        <p>Disclaimer: This report is for informational purposes only and is not necessarily reflecting data reported in income tax return (ITR).</p>
        <p className="font-semibold text-gray-500 whitespace-nowrap ml-4">Page {pageNum} of {totalPages}</p>
      </div>
    </div>
  );

  const Header = ({ title }) => (
    <div className="flex justify-between items-start mb-14">
      <h1 className="text-[28px] font-bold text-[#1f2937] tracking-tight">{title}</h1>
      <div className="text-right">
        <p className="text-[15px] text-[#4b5563] font-medium">Financial Year 2025-26</p>
        <p className="text-[11px] text-[#9ca3af] font-semibold tracking-widest uppercase mt-1">Assessment Year 2026-27</p>
      </div>
    </div>
  );

  const SectionTitle = ({ title }) => (
    <div className="mt-8 mb-6">
      <h2 className="text-[13px] font-bold text-[#1f2937] tracking-wide uppercase mb-2">{title}</h2>
      <hr className="border-t-[1.5px] border-[#1f2937]" />
    </div>
  );

  const tdClass = "py-3 px-4 border-b border-r border-[#e5e7eb] text-[13px] text-[#1f2937]";
  const tdLabelClass = "py-3 px-4 border-b border-r border-[#e5e7eb] text-[13px] text-[#4b5563] bg-[#f9fafb]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-4xl w-full shadow-2xl relative my-8">
        
        {/* Actions Header */}
        <div className="sticky top-0 bg-[#121212] z-10 border-b border-gray-800 p-4 flex justify-between items-center rounded-t-xl shadow-md">
          <h2 className="text-xl font-bold text-white">Document Preview</h2>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleDownload} disabled={isGenerating} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              {isGenerating ? 'Generating PDF...' : 'Download Detailed PDF'}
            </button>
          </div>
        </div>

        {/* PDF Container - Exact scaling 794x1123 */}
        <div className="overflow-x-auto bg-gray-900 flex justify-center py-8">
          <div ref={documentRef} className="flex flex-col text-[#1f2937] bg-gray-100" style={{ width: '794px' }}>
            
            {/* PAGE 1 */}
            <PageWrapper pageNum={1}>
              <Header title="Tax Computation" />
              
              <SectionTitle title="Personal Details" />
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse">
                <tbody>
                  <tr>
                    <td className={tdLabelClass}>Name</td>
                    <td className={`${tdClass} uppercase`}>{data.clientDetails.firstName} {data.clientDetails.lastName}</td>
                    <td className={tdLabelClass}>PAN</td>
                    <td className={`${tdClass} uppercase`}>{data.clientDetails.pan || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className={tdLabelClass}>Date of Birth</td>
                    <td className={tdClass}>--</td>
                    <td className={tdLabelClass}>Mobile Number</td>
                    <td className={tdClass}>--</td>
                  </tr>
                  <tr>
                    <td className={tdLabelClass}>Email</td>
                    <td className={tdClass}>--</td>
                    <td className={tdLabelClass}>Residential Status</td>
                    <td className={`${tdClass} uppercase`}>Resident</td>
                  </tr>
                  <tr>
                    <td className={tdLabelClass}>Address</td>
                    <td colSpan="3" className={tdClass}>--</td>
                  </tr>
                </tbody>
              </table>

              <SectionTitle title="Income Tax Return Details" />
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse">
                <tbody>
                  <tr>
                    <td className={tdLabelClass}>Form</td>
                    <td className={tdClass}>ITR-3</td>
                    <td className={tdLabelClass}>Type</td>
                    <td className={tdClass}>ORIGINAL</td>
                  </tr>
                  <tr>
                    <td className={tdLabelClass}>Regime</td>
                    <td className={tdClass}>NEW</td>
                    <td className={tdLabelClass}>Filing under section</td>
                    <td className={tdClass}>139(1)</td>
                  </tr>
                </tbody>
              </table>

              <SectionTitle title="Tax Computation Summary" />
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse">
                <tbody>
                  <tr>
                    <td className={`${tdClass} font-semibold w-[60%]`}>Gross Total Income</td>
                    <td className={`${tdClass} font-bold text-right w-[40%]`}>₹{formatCur(grossTotalIncome)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>Deductions</td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalDeductions)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>Total Taxable Income</td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalIncome)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>Gross Tax Liability</td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>Interest & Penalty</td>
                    <td className={`${tdClass} font-bold text-right`}>₹0</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>Total Taxes Paid</td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalPrepaid)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdLabelClass} font-bold text-[15px]`}>Tax Dues / (Refund)</td>
                    <td className={`${tdLabelClass} font-bold text-[15px] text-right`}>₹{formatCur(taxDue > 0 ? taxDue : -taxRefund)}</td>
                  </tr>
                </tbody>
              </table>
            </PageWrapper>

            {/* PAGE 2 */}
            <PageWrapper pageNum={2}>
              <Header title="Computation of Income" />
              
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className={`${tdClass} font-bold text-left w-[50%]`}>Particulars</th>
                    <th className={`${tdClass} font-bold text-right w-[25%]`}>Amount</th>
                    <th className={`${tdClass} font-bold text-right w-[25%]`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>1. Total Head-wise Income</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(grossTotalIncome + Number(data.bfla.businessLoss) + Number(data.bfla.stcgLoss) + Number(data.bfla.ltcgLoss))}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>a. Taxable Business & Profession Income</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(grossBusiness)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>b. Taxable Capital Gains</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(grossStcg + grossLtcg)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>c. Taxable Other Sources Income</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(grossOther)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>2. Losses Adjusted</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(Number(data.bfla.businessLoss) + Number(data.bfla.stcgLoss) + Number(data.bfla.ltcgLoss))}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>a. Brought Forward Business Loss</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.bfla.businessLoss)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>b. Brought Forward STCG Loss</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.bfla.stcgLoss)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>c. Brought Forward LTCG Loss</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.bfla.ltcgLoss)}</td>
                    <td className={tdClass}></td>
                  </tr>

                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>3. Gross Total Income (1 - 2)</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(grossTotalIncome)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>4. Total Chapter VI-A Deductions</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalDeductions)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>5. Total Taxable Income (3 - 4)</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalIncome)}</td>
                  </tr>

                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>6. Exempt Income u/s 10</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalExemptIncome)}</td>
                  </tr>
                  {exemptGifts > 0 && (
                    <tr>
                      <td className={`${tdClass} pl-8 text-[#4b5563]`}>Gifts on Specific Occasion</td>
                      <td className={`${tdClass} text-right`}>₹{formatCur(exemptGifts)}</td>
                      <td className={tdClass}></td>
                    </tr>
                  )}
                  {Number(data.exemptIncome.agriculture) > 0 && (
                    <tr>
                      <td className={`${tdClass} pl-8 text-[#4b5563]`}>Agricultural Income</td>
                      <td className={`${tdClass} text-right`}>₹{formatCur(data.exemptIncome.agriculture)}</td>
                      <td className={tdClass}></td>
                    </tr>
                  )}

                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>7. Tax Payable</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalTax)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>a. Tax Payable at Normal Rate</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(normalTax)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>b. Tax Payable at Special Rate (111A STCG)</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(taxUnder111A)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>c. Tax Payable at Special Rate (112A LTCG)</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(taxUnder112A)}</td>
                    <td className={tdClass}></td>
                  </tr>

                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>8. Rebate u/s 87a</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(rebate87a)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>9. Tax Payable after Rebate (7 - 8)</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(taxAfterRebate)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>10. Surcharge & Cess</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(healthEduCess)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>a. Surcharge</td>
                    <td className={`${tdClass} text-right`}>₹0</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>b. Health & Education Cess (4%)</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(healthEduCess)}</td>
                    <td className={tdClass}></td>
                  </tr>
                </tbody>
              </table>
            </PageWrapper>

            {/* PAGE 3 */}
            <PageWrapper pageNum={3}>
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse -mt-10">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className={`${tdClass} font-bold text-left w-[50%]`}>Particulars</th>
                    <th className={`${tdClass} font-bold text-right w-[25%]`}>Amount</th>
                    <th className={`${tdClass} font-bold text-right w-[25%]`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>11. Total Tax and Cess (9 + 10)</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>12. Relief u/s 89</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹0</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>13. Interest & Penalty</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹0</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>a. Late Filing Interest u/s 234A</td>
                    <td className={`${tdClass} text-right`}>₹0</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>b. Default in Advance Tax u/s 234B</td>
                    <td className={`${tdClass} text-right`}>₹0</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>c. Deferment of Advance Tax u/s 234C</td>
                    <td className={`${tdClass} text-right`}>₹0</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>d. Late Filing Fees u/s 234F</td>
                    <td className={`${tdClass} text-right`}>₹0</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>14. Total Tax Payable (11 - 12 + 13)</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} text-[#4b5563]`}>15. Total Taxes Paid</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-right`}>₹{formatCur(totalPrepaid)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>a. Advance Tax</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.prepaidTaxes.advanceTax)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>b. TDS on Salary</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.prepaidTaxes.tdsSalary)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>c. TDS on Other Income</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.prepaidTaxes.tdsOther)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} pl-8 text-[#4b5563]`}>d. TCS</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.prepaidTaxes.tcs)}</td>
                    <td className={tdClass}></td>
                  </tr>
                  <tr>
                    <td className={`${tdLabelClass} font-bold text-[15px]`}>16. Tax Dues / (Refund) (14 - 15)</td>
                    <td className={tdLabelClass}></td>
                    <td className={`${tdLabelClass} font-bold text-[15px] text-right`}>₹{formatCur(taxDue > 0 ? taxDue : -taxRefund)}</td>
                  </tr>
                </tbody>
              </table>

              <SectionTitle title="Quarterly Accrual Details (For Advance Tax)" />
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className={`${tdClass} font-semibold text-left`}>Income Source</th>
                    <th className={`${tdClass} font-semibold text-right`}>Up to 15 Jun</th>
                    <th className={`${tdClass} font-semibold text-right`}>16 Jun - 15 Sep</th>
                    <th className={`${tdClass} font-semibold text-right`}>16 Sep - 15 Dec</th>
                    <th className={`${tdClass} font-semibold text-right`}>16 Dec - 15 Mar</th>
                    <th className={`${tdClass} font-semibold text-right`}>16 Mar - 31 Mar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} font-medium`}>STCG @ 20% (111A)</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.stcg.q1)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.stcg.q2)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.stcg.q3)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.stcg.q4)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.stcg.q5)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-medium`}>LTCG @ 12.5% (112A)</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.ltcg.q1)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.ltcg.q2)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.ltcg.q3)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.ltcg.q4)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.capitalGains.ltcg.q5)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-medium`}>Dividend Income</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.otherSources.dividend.q1)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.otherSources.dividend.q2)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.otherSources.dividend.q3)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.otherSources.dividend.q4)}</td>
                    <td className={`${tdClass} text-right`}>₹{formatCur(data.otherSources.dividend.q5)}</td>
                  </tr>
                </tbody>
              </table>

              <SectionTitle title="Details of Bank Accounts" />
              <table className="w-full border-l border-t border-[#e5e7eb] mb-10 border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className={`${tdClass} font-semibold text-left`}>Bank Name</th>
                    <th className={`${tdClass} font-semibold text-left`}>IFSC Code</th>
                    <th className={`${tdClass} font-semibold text-left`}>Account No.</th>
                    <th className={`${tdClass} font-semibold text-left`}>Type</th>
                    <th className={`${tdClass} font-semibold text-center`}>Refund?</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.length > 0 ? bankAccounts.map((b, i) => (
                    <tr key={i}>
                      <td className={tdClass}>{b.bankName || '--'}</td>
                      <td className={tdClass}>{b.ifsc || '--'}</td>
                      <td className={tdClass}>{b.accountNumber || '--'}</td>
                      <td className={tdClass}>{b.type || 'Savings'}</td>
                      <td className={`${tdClass} text-center`}>
                        {b.isRefund ? (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[11px] font-bold">Yes</span>
                        ) : '--'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className={`${tdClass} text-center`}>--</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </PageWrapper>

            {/* PAGE 4 & 5 (CONDITIONAL BALANCE SHEET) */}
            {data.incomes.hasBusiness && (
              <>
                <PageWrapper pageNum={4}>
                  <Header title="Balance Sheet" />
                  <div className="mt-8 mb-6">
                    <h2 className="text-[15px] font-bold text-[#1f2937]">Balance Sheet as of 31st March 2026</h2>
                  </div>
                  
                  <table className="w-full border-l border-t border-[#e5e7eb] border-collapse">
                    <thead>
                      <tr className="bg-[#f9fafb]">
                        <th className={`${tdClass} font-bold text-left w-[50%]`}>Particulars</th>
                        <th className={`${tdClass} font-bold text-right w-[25%]`}>Amount</th>
                        <th className={`${tdClass} font-bold text-right w-[25%]`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Equity & Liabilities</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsTotalLiab)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Equity</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsEquity)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Proprietor's Capital</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.equityCapital)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Reserves & Surplus</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.equityReserves)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Non-Current Liabilities</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsNonCurrentLiab)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Secured Loans</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.nonCurrentSecured)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Unsecured Loans</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.nonCurrentUnsecured)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Advances</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.nonCurrentAdvances)}</td>
                        <td className={tdClass}></td>
                      </tr>

                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Current Liabilities</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsCurrentLiab)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Payables</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentPayables)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Provisions for Expenses</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentProvisions)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Other Current Liabilities</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentOtherLiab)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Total Equity & Liabilities</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsTotalLiab)}</td>
                      </tr>
                    </tbody>
                  </table>
                </PageWrapper>

                <PageWrapper pageNum={5}>
                  <Header title="Balance Sheet (Cont.)" />
                  
                  <table className="w-full border-l border-t border-[#e5e7eb] border-collapse mt-8">
                    <thead>
                      <tr className="bg-[#f9fafb]">
                        <th className={`${tdClass} font-bold text-left w-[50%]`}>Particulars</th>
                        <th className={`${tdClass} font-bold text-right w-[25%]`}>Amount</th>
                        <th className={`${tdClass} font-bold text-right w-[25%]`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Assets</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsTotalAssets)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Fixed Assets</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsFixedNet)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Net Block (Gross Block - Depreciation)</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(bsFixedNet)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Investments</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsInvest)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Short Term Investments</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.investmentsST)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Long Term Investments</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.investmentsLT)}</td>
                        <td className={tdClass}></td>
                      </tr>

                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Current Assets</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsCurrentAssets)}</td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Bank Balance</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentBank)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Cash Balance</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentCash)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Closing Stock</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentStock)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Receivables</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentReceivables)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Loans and Advances</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentLoansGiven)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      <tr>
                        <td className={`${tdClass} pl-8 text-[#4b5563]`}>Other Current Assets</td>
                        <td className={`${tdClass} text-right`}>₹{formatCur(business.balanceSheet.currentOther)}</td>
                        <td className={tdClass}></td>
                      </tr>
                      
                      <tr>
                        <td className={`${tdClass} text-[#4b5563]`}>Total Assets</td>
                        <td className={tdClass}></td>
                        <td className={`${tdClass} font-bold text-right`}>₹{formatCur(bsTotalAssets)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {bsTotalAssets !== bsTotalLiab && (
                    <p className="text-red-500 font-bold mt-4 text-[13px] text-center">Warning: Balance Sheet does not tally. Difference: ₹{formatCur(Math.abs(bsTotalAssets - bsTotalLiab))}</p>
                  )}
                </PageWrapper>
              </>
            )}

            {/* CAPITAL GAINS TRANSACTIONS */}
            {cgTransactions.length > 0 && Array.from({ length: Math.ceil(cgTransactions.length / 10) }).map((_, pageIdx) => (
              <PageWrapper key={`cg-${pageIdx}`} pageNum={(data.incomes.hasBusiness ? 5 : 3) + pageIdx + 1}>
                <SectionTitle title={`Capital Gains Transactions (Part ${pageIdx + 1})`} />
                <table className="w-full border-l border-t border-[#e5e7eb] border-collapse">
                  <thead>
                    <tr className="bg-[#f9fafb]">
                      <th className={`${tdClass} font-semibold text-left`}>Asset</th>
                      <th className={`${tdClass} font-semibold text-left`}>Buy Date</th>
                      <th className={`${tdClass} font-semibold text-left`}>Sell Date</th>
                      <th className={`${tdClass} font-semibold text-right`}>Buy Val</th>
                      <th className={`${tdClass} font-semibold text-right`}>Sell Val</th>
                      <th className={`${tdClass} font-semibold text-right`}>Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cgTransactions.slice(pageIdx * 10, (pageIdx + 1) * 10).map((t, i) => {
                      const gain = Number(t.sellValue) - Number(t.buyValue) - Number(t.expenses);
                      return (
                        <tr key={i}>
                          <td className={tdClass}>{t.assetName || '--'}</td>
                          <td className={tdClass}>{t.buyDate || '--'}</td>
                          <td className={tdClass}>{t.sellDate || '--'}</td>
                          <td className={`${tdClass} text-right`}>₹{formatCur(t.buyValue)}</td>
                          <td className={`${tdClass} text-right`}>₹{formatCur(t.sellValue)}</td>
                          <td className={`${tdClass} text-right font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gain >= 0 ? '₹' : '-₹'}{formatCur(Math.abs(gain))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PageWrapper>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
