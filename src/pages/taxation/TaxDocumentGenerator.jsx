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
  const taxDeductors = data.taxDeductors || [];
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

  // --- REUSABLE COMPONENTS FOR PDF ---
  const TitleHeader = ({ title }) => (
    <div className="flex justify-between items-start mb-10 pb-4 border-b border-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h1>
      <div className="text-right">
        <p className="text-lg text-gray-700 font-semibold">Financial Year 2025-26</p>
        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">Assessment Year 2026-27</p>
      </div>
    </div>
  );

  const SectionHeader = ({ title }) => (
    <div className="mt-8 mb-4 border-b-2 border-gray-800 pb-1">
      <h2 className="text-sm font-bold text-gray-800 tracking-wide uppercase">{title}</h2>
    </div>
  );

  const TableLayout = ({ children, header1 = "Particulars", header2 = "Amount", header3 = "Total" }) => (
    <table className="w-full text-[13px] border-collapse mb-8 border border-gray-200">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="py-2.5 px-4 text-left font-bold text-gray-800 w-[60%] border-r border-gray-200">{header1}</th>
          <th className="py-2.5 px-4 text-right font-bold text-gray-800 w-[20%] border-r border-gray-200">{header2}</th>
          <th className="py-2.5 px-4 text-right font-bold text-gray-800 w-[20%]">{header3}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {children}
      </tbody>
    </table>
  );

  const Tr = ({ label, amt, total, isBold = false, isSub = false, isHeader = false }) => (
    <tr className={`${isHeader ? 'bg-gray-50' : ''}`}>
      <td className={`py-2 px-4 border-r border-gray-200 ${isBold ? 'font-bold text-gray-800' : 'text-gray-700'} ${isSub ? 'pl-8 text-gray-600' : ''}`}>
        {label}
      </td>
      <td className={`py-2 px-4 text-right border-r border-gray-200 ${isBold ? 'font-bold' : ''}`}>
        {amt !== undefined && amt !== null ? `₹${formatCur(amt)}` : ''}
      </td>
      <td className={`py-2 px-4 text-right ${isBold || isHeader ? 'font-bold text-gray-900' : ''}`}>
        {total !== undefined && total !== null ? `₹${formatCur(total)}` : ''}
      </td>
    </tr>
  );

  const TwoColTable = ({ children }) => (
    <table className="w-full text-[13px] border-collapse mb-8 border border-gray-200">
      <tbody className="divide-y divide-gray-200">
        {children}
      </tbody>
    </table>
  );

  const TwoColTr = ({ label1, val1, label2, val2 }) => (
    <tr>
      <td className="py-2 px-4 border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 w-1/4">{label1}</td>
      <td className="py-2 px-4 border-r border-gray-200 text-gray-900 w-1/4 uppercase">{val1}</td>
      <td className="py-2 px-4 border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 w-1/4">{label2}</td>
      <td className="py-2 px-4 text-gray-900 w-1/4 uppercase">{val2}</td>
    </tr>
  );

  const PageFooter = ({ num, total }) => (
    <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-200">
      <p>Disclaimer: This report is for informational purposes only and is not necessarily reflecting data reported in income tax return (ITR).</p>
      <p className="font-semibold text-gray-500 whitespace-nowrap ml-4">Page {num} of {total}</p>
    </div>
  );

  const totalPages = (data.incomes.hasBusiness ? 5 : 3) + (cgTransactions.length > 0 ? Math.ceil(cgTransactions.length / 10) : 0);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
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

        {/* PDF Container - A4 size strict rendering at 96 DPI: 794px x 1123px per page */}
        <div className="overflow-x-auto bg-gray-900 flex justify-center py-8">
          <div ref={documentRef} className="flex flex-col gap-y-4" style={{ width: '794px' }}>
            
            {/* PAGE 1: Personal Details & Summary */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden shadow-xl">
              <TitleHeader title="Tax Computation" />
              
              <SectionHeader title="Personal Details" />
              <TwoColTable>
                <TwoColTr label1="Name" val1={`${data.clientDetails.firstName} ${data.clientDetails.lastName || ''}`} label2="PAN" val2={data.clientDetails.pan || 'N/A'} />
                <TwoColTr label1="Date of Birth" val1="--" label2="Mobile Number" val2="--" />
                <TwoColTr label1="Email" val1="--" label2="Residential Status" val2="Resident" />
                <tr>
                  <td className="py-2 px-4 border-r border-gray-200 bg-gray-50 font-semibold text-gray-700">Address</td>
                  <td colSpan="3" className="py-2 px-4 text-gray-900">--</td>
                </tr>
              </TwoColTable>

              <SectionHeader title="Income Tax Return Details" />
              <TwoColTable>
                <TwoColTr label1="Form" val1="ITR-3" label2="Type" val2="Original" />
                <TwoColTr label1="Regime" val1="New" label2="Filing under section" val2="139(1)" />
              </TwoColTable>

              <SectionHeader title="Tax Computation Summary" />
              <TableLayout header1="" header2="" header3="">
                <Tr label="Gross Total Income" isBold={true} total={grossTotalIncome} />
                <Tr label="Deductions" isBold={true} total={totalDeductions} />
                <Tr label="Total Taxable Income" isBold={true} total={totalIncome} />
                <Tr label="Gross Tax Liability" isBold={true} total={grossTaxLiability} />
                <Tr label="Interest & Penalty" isBold={true} total={0} />
                <Tr label="Total Taxes Paid" isBold={true} total={totalPrepaid} />
                <tr className="bg-gray-100 border-t border-gray-300">
                  <td colSpan="2" className="py-3 px-4 font-bold text-gray-900 text-base">Tax Dues / (Refund)</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900 text-base">₹{formatCur(taxDue > 0 ? taxDue : -taxRefund)}</td>
                </tr>
              </TableLayout>

              <PageFooter num={1} total={totalPages} />
            </div>

            {/* PAGE 2: Detailed Computation of Income */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden shadow-xl">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Computation of Income</h2>
              
              <TableLayout>
                <Tr label="1. Total Head-wise Income" isHeader={true} total={grossTotalIncome + Number(data.bfla.businessLoss) + Number(data.bfla.stcgLoss) + Number(data.bfla.ltcgLoss)} />
                <Tr label="a. Taxable Business & Profession Income" amt={grossBusiness} isSub={true} />
                <Tr label="b. Taxable Capital Gains" amt={grossStcg + grossLtcg} isSub={true} />
                <Tr label="c. Taxable Other Sources Income" amt={grossOther} isSub={true} />
                {Number(data.otherSources.familyPension) > 0 && <Tr label="Family Pension (Gross)" amt={Number(data.otherSources.familyPension)} isSub={true} />}
                {Number(data.otherSources.familyPension) > 0 && <Tr label="Less: Family Pension Standard Deduction" amt={-familyPensionDeduction} isSub={true} />}

                <Tr label="2. Losses Adjusted" isHeader={true} total={Number(data.bfla.businessLoss) + Number(data.bfla.stcgLoss) + Number(data.bfla.ltcgLoss)} />
                <Tr label="a. Brought Forward Business Loss" amt={data.bfla.businessLoss} isSub={true} />
                <Tr label="b. Brought Forward STCG Loss" amt={data.bfla.stcgLoss} isSub={true} />
                <Tr label="c. Brought Forward LTCG Loss" amt={data.bfla.ltcgLoss} isSub={true} />

                <Tr label="3. Gross Total Income (1 - 2)" isHeader={true} total={grossTotalIncome} />
                
                <Tr label="4. Total Chapter VI-A Deductions" isHeader={true} total={totalDeductions} />
                {data.deductions.sec80CCD2 > 0 && <Tr label="Section 80CCD(2)" amt={data.deductions.sec80CCD2} isSub={true} />}
                {data.deductions.sec80CCH > 0 && <Tr label="Section 80CCH" amt={data.deductions.sec80CCH} isSub={true} />}

                <Tr label="5. Total Taxable Income (3 - 4)" isHeader={true} total={totalIncome} />

                <Tr label="6. Exempt Income u/s 10" isHeader={true} total={totalExemptIncome} />
                {data.exemptIncome.agriculture > 0 && <Tr label="Agricultural Income" amt={data.exemptIncome.agriculture} isSub={true} />}
                {data.exemptIncome.insuranceMaturity > 0 && <Tr label="Life Insurance Maturity" amt={data.exemptIncome.insuranceMaturity} isSub={true} />}
                {exemptGifts > 0 && (
                  <Tr 
                    label={data.otherSources.gifts.exemptGiftNarration ? `Gifts on Specific Occasion (${data.otherSources.gifts.exemptGiftNarration})` : `Gifts on Specific Occasion`} 
                    amt={exemptGifts} 
                    isSub={true} 
                  />
                )}
                {data.exemptIncome.ppfInterest > 0 && <Tr label="PPF Interest" amt={data.exemptIncome.ppfInterest} isSub={true} />}
                {data.exemptIncome.otherExempt > 0 && <Tr label="Other Exempt Income" amt={data.exemptIncome.otherExempt} isSub={true} />}

                <Tr label="7. Tax Payable" isHeader={true} total={totalTax} />
                <Tr label="a. Tax Payable at Normal Rate" amt={normalTax} isSub={true} />
                <Tr label="b. Tax Payable at Special Rate (111A STCG)" amt={taxUnder111A} isSub={true} />
                <Tr label="c. Tax Payable at Special Rate (112A LTCG)" amt={taxUnder112A} isSub={true} />

                <Tr label="8. Rebate u/s 87a" isHeader={true} total={rebate87a} />
                
                <Tr label="9. Tax Payable after Rebate (7 - 8)" isHeader={true} total={taxAfterRebate} />

                <Tr label="10. Surcharge & Cess" isHeader={true} total={healthEduCess} />
                <Tr label="a. Surcharge" amt={0} isSub={true} />
                <Tr label="b. Health & Education Cess (4%)" amt={healthEduCess} isSub={true} />
              </TableLayout>

              <PageFooter num={2} total={totalPages} />
            </div>

            {/* PAGE 3: Accruals & Taxes Paid */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden shadow-xl">
              <TableLayout>
                <Tr label="11. Total Tax and Cess (9 + 10)" isHeader={true} total={grossTaxLiability} />
                <Tr label="12. Relief u/s 89" isHeader={true} total={0} />
                <Tr label="13. Interest & Penalty" isHeader={true} total={0} />
                <Tr label="a. Late Filing Interest u/s 234A" amt={0} isSub={true} />
                <Tr label="b. Default in Advance Tax u/s 234B" amt={0} isSub={true} />
                <Tr label="c. Deferment of Advance Tax u/s 234C" amt={0} isSub={true} />
                <Tr label="d. Late Filing Fees u/s 234F" amt={0} isSub={true} />
                <Tr label="14. Total Tax Payable (11 - 12 + 13)" isHeader={true} total={grossTaxLiability} />
                
                <Tr label="15. Total Taxes Paid" isHeader={true} total={totalPrepaid} />
                <Tr label="a. Advance Tax" amt={data.prepaidTaxes.advanceTax} isSub={true} />
                <Tr label="b. TDS on Salary" amt={data.prepaidTaxes.tdsSalary} isSub={true} />
                <Tr label="c. TDS on Other Income" amt={data.prepaidTaxes.tdsOther} isSub={true} />
                <Tr label="d. TCS" amt={data.prepaidTaxes.tcs} isSub={true} />
                
                <tr className="bg-gray-100 border-y border-gray-300">
                  <td colSpan="2" className="py-3 px-4 font-bold text-gray-900 text-base">16. Tax Dues / (Refund) (14 - 15)</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900 text-base">₹{formatCur(taxDue > 0 ? taxDue : -taxRefund)}</td>
                </tr>
              </TableLayout>

              <SectionHeader title="Quarterly Accrual Details (For Advance Tax)" />
              <table className="w-full text-[11px] border-collapse mb-8 border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Income Source</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">Up to 15 Jun</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">16 Jun - 15 Sep</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">16 Sep - 15 Dec</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">16 Dec - 15 Mar</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-800">16 Mar - 31 Mar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-gray-200">STCG @ 20% (111A)</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.stcg.q1)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.stcg.q2)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.stcg.q3)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.stcg.q4)}</td>
                    <td className="py-2 px-3 text-right">₹{formatCur(data.capitalGains.stcg.q5)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-gray-200">LTCG @ 12.5% (112A)</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.ltcg.q1)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.ltcg.q2)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.ltcg.q3)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.capitalGains.ltcg.q4)}</td>
                    <td className="py-2 px-3 text-right">₹{formatCur(data.capitalGains.ltcg.q5)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-gray-200">Dividend Income</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.otherSources.dividend.q1)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.otherSources.dividend.q2)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.otherSources.dividend.q3)}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(data.otherSources.dividend.q4)}</td>
                    <td className="py-2 px-3 text-right">₹{formatCur(data.otherSources.dividend.q5)}</td>
                  </tr>
                </tbody>
              </table>

              {taxDeductors.length > 0 && (
                <>
                  <SectionHeader title="Statement of Taxes Paid (Form 26AS/AIS)" />
                  <table className="w-full text-[11px] border-collapse mb-8 border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Name of Deductor</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">TAN / PAN</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Tax Type</th>
                        <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">Gross Amt.</th>
                        <th className="py-2 px-3 text-right font-bold text-gray-800">Tax Deducted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {taxDeductors.map((row, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 border-r border-gray-200">{row.deductorName || '--'}</td>
                          <td className="py-2 px-3 border-r border-gray-200 uppercase">{row.tan || '--'}</td>
                          <td className="py-2 px-3 border-r border-gray-200">{row.type}</td>
                          <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(row.grossAmount)}</td>
                          <td className="py-2 px-3 text-right font-semibold">₹{formatCur(row.taxDeducted)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="4" className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">Total Taxes Claimed</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">₹{formatCur(totalPrepaid)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {bankAccounts.length > 0 && (
                <>
                  <SectionHeader title="Details of Bank Accounts" />
                  <table className="w-full text-[11px] border-collapse mb-8 border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Bank Name</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">IFSC Code</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Account No.</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Type</th>
                        <th className="py-2 px-3 text-center font-bold text-gray-800">Refund?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {bankAccounts.map((row, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 border-r border-gray-200 font-semibold">{row.bankName || '--'}</td>
                          <td className="py-2 px-3 border-r border-gray-200 uppercase">{row.ifsc || '--'}</td>
                          <td className="py-2 px-3 border-r border-gray-200">{row.accountNumber || '--'}</td>
                          <td className="py-2 px-3 border-r border-gray-200">{row.type}</td>
                          <td className="py-2 px-3 text-center">
                            {row.isRefund ? <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold">Yes</span> : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <PageFooter num={3} total={totalPages} />
            </div>

            {/* PAGE X: Capital Gains Transactions (Chunked) */}
            {cgTransactions.length > 0 && Array.from({ length: Math.ceil(cgTransactions.length / 10) }).map((_, pageIdx) => {
              const chunk = cgTransactions.slice(pageIdx * 10, (pageIdx + 1) * 10);
              return (
                <div key={`cg-page-${pageIdx}`} className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden shadow-xl">
                  <SectionHeader title={`Capital Gains Transactions (Part ${pageIdx + 1})`} />
                  <table className="w-full text-[11px] border-collapse mb-8 border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Asset</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Buy Date</th>
                        <th className="py-2 px-3 text-left font-bold text-gray-800 border-r border-gray-200">Sell Date</th>
                        <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">Buy Val</th>
                        <th className="py-2 px-3 text-right font-bold text-gray-800 border-r border-gray-200">Sell Val</th>
                        <th className="py-2 px-3 text-right font-bold text-gray-800">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {chunk.map((row, i) => {
                        const profit = (Number(row.sellValue) || 0) - (Number(row.buyValue) || 0) - (Number(row.expenses) || 0);
                        return (
                          <tr key={i}>
                            <td className="py-2 px-3 border-r border-gray-200">
                              <span className="font-semibold">{row.assetName || '--'}</span>
                              {row.isin && <div className="text-[9px] text-gray-500 uppercase">{row.isin}</div>}
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200">{row.buyDate || '--'}</td>
                            <td className="py-2 px-3 border-r border-gray-200">{row.sellDate || '--'}</td>
                            <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(row.buyValue)}</td>
                            <td className="py-2 px-3 text-right border-r border-gray-200">₹{formatCur(row.sellValue)}</td>
                            <td className={`py-2 px-3 text-right font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              ₹{formatCur(profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PageFooter num={4 + pageIdx} total={totalPages} />
                </div>
              );
            })}

            {/* PAGE 4: Balance Sheet (Equity & Liab) */}
            {data.incomes.hasBusiness && (
              <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden shadow-xl">
                <TitleHeader title="Balance Sheet" />
                <p className="text-sm font-semibold text-gray-800 mb-4">Balance Sheet as of 31st March 2026</p>
                
                <TableLayout>
                  <Tr label="Equity & Liabilities" isHeader={true} total={bsTotalLiab} />
                  
                  <Tr label="Equity" isHeader={true} total={bsEquity} />
                  <Tr label="Proprietor's Capital" amt={business.balanceSheet.equityCapital} isSub={true} />
                  <Tr label="Reserves & Surplus" amt={business.balanceSheet.equityReserves} isSub={true} />

                  <Tr label="Non-Current Liabilities" isHeader={true} total={bsNonCurrentLiab} />
                  <Tr label="Secured Loans" amt={business.balanceSheet.nonCurrentSecured} isSub={true} />
                  <Tr label="Unsecured Loans" amt={business.balanceSheet.nonCurrentUnsecured} isSub={true} />
                  <Tr label="Advances" amt={business.balanceSheet.nonCurrentAdvances} isSub={true} />

                  <Tr label="Current Liabilities" isHeader={true} total={bsCurrentLiab} />
                  <Tr label="Payables" amt={business.balanceSheet.currentPayables} isSub={true} />
                  <Tr label="Provisions for Expenses" amt={business.balanceSheet.currentProvisions} isSub={true} />
                  <Tr label="Other Current Liabilities" amt={business.balanceSheet.currentOtherLiab} isSub={true} />
                  
                  <Tr label="Total Equity & Liabilities" isHeader={true} total={bsTotalLiab} />
                </TableLayout>

                <PageFooter num={4 + (cgTransactions.length > 0 ? Math.ceil(cgTransactions.length / 10) : 0)} total={totalPages} />
              </div>
            )}

            {/* PAGE 5: Balance Sheet (Assets) */}
            {data.incomes.hasBusiness && (
              <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 overflow-hidden shadow-xl">
                <h2 className="text-xl font-bold text-gray-800 mb-6 mt-4">Balance Sheet (Cont.)</h2>
                
                <TableLayout>
                  <Tr label="Assets" isHeader={true} total={bsTotalAssets} />
                  
                  <Tr label="Fixed Assets" isHeader={true} total={bsFixedNet} />
                  <Tr label="Net Block (Gross Block - Depreciation)" amt={bsFixedNet} isSub={true} />

                  <Tr label="Investments" isHeader={true} total={bsInvest} />
                  <Tr label="Short Term Investments" amt={business.balanceSheet.investmentsST} isSub={true} />
                  <Tr label="Long Term Investments" amt={business.balanceSheet.investmentsLT} isSub={true} />

                  <Tr label="Current Assets" isHeader={true} total={bsCurrentAssets} />
                  <Tr label="Bank Balance" amt={business.balanceSheet.currentBank} isSub={true} />
                  <Tr label="Cash Balance" amt={business.balanceSheet.currentCash} isSub={true} />
                  <Tr label="Closing Stock" amt={business.balanceSheet.currentStock} isSub={true} />
                  <Tr label="Receivables" amt={business.balanceSheet.currentReceivables} isSub={true} />
                  <Tr label="Loans and Advances" amt={business.balanceSheet.currentLoansGiven} isSub={true} />
                  <Tr label="Other Current Assets" amt={business.balanceSheet.currentOther} isSub={true} />
                  
                  <Tr label="Total Assets" isHeader={true} total={bsTotalAssets} />
                </TableLayout>

                <PageFooter num={5 + (cgTransactions.length > 0 ? Math.ceil(cgTransactions.length / 10) : 0)} total={totalPages} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
