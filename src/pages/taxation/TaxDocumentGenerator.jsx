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
  const bankAccounts = data.bankAccounts || [];
  const taxDeductors = data.taxDeductors || [];

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

  const handleDownload = () => {
    setIsGenerating(true);
    const element = documentRef.current;
    const opt = {
      margin: 0,
      filename: `Detailed_Computation_${data.clientDetails.pan || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 794 },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
      onClose();
    });
  };

  // Tax2Win Strict Styling
  const tableBorder = "border border-black border-collapse";
  const cellStyle = "p-2 border border-black text-[13px]";
  const boldHeader = "p-2 font-bold bg-white text-[13px] border border-black";
  
  const HeaderLogo = () => (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-2 text-[#2b59ff] font-bold text-2xl tracking-tighter">
        <div className="w-8 h-8 rounded-full bg-[#2b59ff] flex items-center justify-center text-white">
          A
        </div>
        Aarthika
      </div>
      <div className="text-[13px]">ITR #2845613</div>
    </div>
  );

  const TitleHeader = ({ title }) => (
    <h1 className="text-center text-xl font-normal mb-8">{title}</h1>
  );

  const PageFooter = ({ pageNum }) => (
    <div className="absolute bottom-6 left-12 right-12 flex justify-between text-[11px] text-gray-800">
      <div>Aarthika.in</div>
      <div>Page {pageNum}</div>
      <div>2026-08-04 18:46:14</div>
    </div>
  );

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

        {/* PDF Container - Exact scaling 794x1123 */}
        <div className="overflow-x-auto bg-gray-900 flex justify-center py-8">
          <div ref={documentRef} className="flex flex-col text-black bg-white" style={{ width: '794px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            
            {/* PAGE 1 */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 shadow-sm border-b border-gray-300">
              <HeaderLogo />
              <TitleHeader title="Detailed Computation as per New Tax Regime (ITR-4)" />
              
              <h2 className="text-center text-[22px] font-normal mb-6">Basic Details</h2>
              <table className={`w-full ${tableBorder} mb-8`}>
                <tbody>
                  <tr><td colSpan="4" className={`${boldHeader}`}>Personal Information</td></tr>
                  <tr>
                    <td className={`${boldHeader} w-1/4`}>Name</td>
                    <td colSpan="3" className={`${cellStyle}`}>{data.clientDetails.firstName} {data.clientDetails.lastName}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Permanent Address</td>
                    <td colSpan="3" className={`${cellStyle}`}>--</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Father's Name</td>
                    <td colSpan="3" className={`${cellStyle}`}>--</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>PAN</td>
                    <td className={`${cellStyle} w-1/4 uppercase`}>{data.clientDetails.pan || 'N/A'}</td>
                    <td className={`${boldHeader} w-1/4`}>Date of Birth</td>
                    <td className={`${cellStyle} w-1/4`}>--</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>E-Mail</td>
                    <td className={`${cellStyle}`}>--</td>
                    <td className={`${boldHeader}`}>Financial Year</td>
                    <td className={`${cellStyle}`}>01-04-2025 to 31-03-2026</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Mobile</td>
                    <td className={`${cellStyle}`}>--</td>
                    <td className={`${boldHeader}`}>Assessment Year</td>
                    <td className={`${cellStyle}`}>01-04-2026 to 31-03-2027</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Residential Status</td>
                    <td className={`${cellStyle}`}>Resident</td>
                    <td className={`${boldHeader}`}>Status</td>
                    <td className={`${cellStyle}`}>Individual</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Return Type</td>
                    <td className={`${cellStyle}`}>Original Return</td>
                    <td className={`${boldHeader}`}>Regime</td>
                    <td className={`${cellStyle}`}>New Tax Regime</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Return Filed Section</td>
                    <td className={`${cellStyle}`}>On Or Before Due Date 139(1)</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle}`}></td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-center text-[22px] font-normal mb-6 mt-12">Computation of Income</h2>
              <table className={`w-full ${tableBorder}`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Description</th>
                    <th className={`${boldHeader} text-center w-[20%]`}>Amount</th>
                    <th className={`${boldHeader} text-center w-[20%]`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${boldHeader}`}>Income from Salary</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Income from Business (Annexure #1)</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossBusiness)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader} pl-8`}>Income from Presumptive (Annexure #1)</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle}`}></td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle} pl-12`}>Section 44AD (Annexure #1)</td>
                    <td className={`${cellStyle} text-right`}>{formatCur(grossBusiness)}</td>
                    <td className={`${cellStyle}`}></td>
                  </tr>
                  {(grossStcg > 0 || grossLtcg > 0) && (
                    <tr>
                      <td className={`${boldHeader}`}>Income from Capital Gains</td>
                      <td className={`${cellStyle}`}></td>
                      <td className={`${boldHeader} text-right`}>{formatCur(grossStcg + grossLtcg)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className={`${boldHeader}`}>Income from House Property</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Income from Other Sources (Annexure #2)</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossOther)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Gross Total Income</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossTotalIncome)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Gross Total Income including LTCG u/s 112A</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossTotalIncome)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Less: Deductions</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(totalDeductions)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Taxable Total Income</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(totalIncome)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Tax Payable on Total Income</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(totalTax)}</td>
                  </tr>
                </tbody>
              </table>

              <PageFooter pageNum={1} />
            </div>

            {/* PAGE 2 */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 shadow-sm border-b border-gray-300">
              <div className="flex justify-end text-[13px] mb-4">ITR #2845613</div>
              <table className={`w-full ${tableBorder}`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Description</th>
                    <th className={`${boldHeader} text-center w-[20%]`}>Amount</th>
                    <th className={`${boldHeader} text-center w-[20%]`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${cellStyle}`}>Less: Rebate u/s 87A</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>{formatCur(rebate87a)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Tax Payable After Rebate</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(taxAfterRebate)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle} pl-8`}>Add: Surcharge</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle} pl-8`}>Add: Health & Education Cess</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>{formatCur(healthEduCess)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Gross Tax Liability</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>Balance Tax After Relief</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Less: Total Advance Tax Paid</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>{formatCur(data.prepaidTaxes.advanceTax)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Less: Total Self Assessment Tax Paid</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Less: Total TDS Claimed</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>{formatCur(Number(data.prepaidTaxes.tdsSalary) + Number(data.prepaidTaxes.tdsOther))}</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Less: Tax Collected at Source</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>{formatCur(data.prepaidTaxes.tcs)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Add: Interest u/s 234A</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Add: Interest u/s 234B</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Add: Interest u/s 234C</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Add: Late Filing Fees u/s 234F</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>0.00</td>
                  </tr>
                  <tr>
                    <td className={`${boldHeader}`}>{taxDue > 0 ? 'Tax Payable' : 'Refund Due'}</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(taxDue > 0 ? taxDue : taxRefund)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellStyle}`}>Exempt Income (Only for reporting purposes)(Annexure #3)</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${cellStyle} text-right`}>{formatCur(totalExemptIncome)}</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-center text-[22px] font-normal mb-6 mt-16">Details of Bank Accounts</h2>
              <table className={`w-full ${tableBorder}`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Bank Name</th>
                    <th className={`${boldHeader} text-center`}>IFSC Code</th>
                    <th className={`${boldHeader} text-center`}>Account Number</th>
                    <th className={`${boldHeader} text-center`}>Account Type</th>
                    <th className={`${boldHeader} text-center`}>Selected for Refund?</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.length > 0 ? bankAccounts.map((b, i) => (
                    <tr key={i}>
                      <td className={`${cellStyle} text-center`}>{b.bankName || '--'}</td>
                      <td className={`${cellStyle} text-center`}>{b.ifsc || '--'}</td>
                      <td className={`${cellStyle} text-center`}>{b.accountNumber || '--'}</td>
                      <td className={`${cellStyle} text-center`}>{b.type || '--'}</td>
                      <td className={`${cellStyle} text-center`}>{b.isRefund ? 'Yes' : 'No'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className={`${cellStyle} text-center`}>No Bank Accounts</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <PageFooter pageNum={2} />
            </div>

            {/* PAGE 3 */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 shadow-sm border-b border-gray-300">
              <div className="flex justify-end text-[13px] mb-4">ITR #2845613</div>
              <h2 className="text-center text-[22px] font-normal mb-2">Statement of Taxes Paid</h2>
              <p className="text-center text-[13px] mb-4">Details of Tax Deducted at Source on Income Other than Salary<br/>As per Form 16A issued by Deductor(s)</p>
              
              <table className={`w-full ${tableBorder} mb-12`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Name of Deductor</th>
                    <th className={`${boldHeader} text-center`}>TAN of the Deductor</th>
                    <th className={`${boldHeader} text-center`}>Deducted Year</th>
                    <th className={`${boldHeader} text-center`}>Gross amount on which TDS deducted</th>
                    <th className={`${boldHeader} text-center`}>Tax Deducted</th>
                    <th className={`${boldHeader} text-center`}>Head of Income</th>
                  </tr>
                </thead>
                <tbody>
                  {taxDeductors.length > 0 ? taxDeductors.map((t, i) => (
                    <tr key={i}>
                      <td className={`${cellStyle}`}>{t.deductorName || '--'}</td>
                      <td className={`${cellStyle}`}>{t.tan || '--'}</td>
                      <td className={`${cellStyle} text-center`}>2025</td>
                      <td className={`${cellStyle} text-right`}>{formatCur(t.grossAmount)}</td>
                      <td className={`${cellStyle} text-right`}>{formatCur(t.taxDeducted)}</td>
                      <td className={`${cellStyle} text-center`}>{t.headOfIncome || 'Income from Other Source'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className={`${cellStyle} text-center`}>No Deductors</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" className={`${boldHeader} text-right`}>Total</td>
                    <td className={`${boldHeader} text-right`}>{formatCur(taxDeductors.reduce((sum, d) => sum + Number(d.grossAmount), 0))}</td>
                    <td className={`${boldHeader} text-right`}>{formatCur(taxDeductors.reduce((sum, d) => sum + Number(d.taxDeducted), 0))}</td>
                    <td className={`${cellStyle}`}></td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-center text-[22px] font-normal mb-2">Income from Business</h2>
              <p className="text-center text-[13px] mb-6">Note: For detailed calculations refer to</p>
              <h3 className="text-center text-lg mb-2">Annexure #1: Section 44AD (Income from Presumptive)</h3>
              
              <table className={`w-full ${tableBorder} mb-12`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Business Name</th>
                    <th className={`${boldHeader} text-center`}>Turnover</th>
                    <th className={`${boldHeader} text-center`}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${cellStyle} text-center`}>{business.businessName || 'Retail Sale of Other Products'}</td>
                    <td className={`${cellStyle} text-right`}>{formatCur(Number(business.turnoverBank) + Number(business.turnoverCash))}</td>
                    <td className={`${cellStyle} text-right`}>{formatCur(grossBusiness)}</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-center text-[22px] font-normal mb-4">Income from Other Sources</h2>
              <h3 className="text-center text-lg mb-4">(Annexure #2)</h3>
              
              <table className={`w-full ${tableBorder}`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Particulars</th>
                    <th className={`${boldHeader} text-center w-[20%]`}>Amount</th>
                    <th className={`${boldHeader} text-center w-[20%]`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Number(data.otherSources.savingsInterest) > 0 && (
                    <tr><td className={`${cellStyle}`}>Saving Bank Interest</td><td className={`${cellStyle}`}></td><td className={`${cellStyle} text-right`}>{formatCur(data.otherSources.savingsInterest)}</td></tr>
                  )}
                  {Number(data.otherSources.fdInterest) > 0 && (
                    <tr><td className={`${cellStyle}`}>Interest on Fixed Deposit</td><td className={`${cellStyle}`}></td><td className={`${cellStyle} text-right`}>{formatCur(data.otherSources.fdInterest)}</td></tr>
                  )}
                  {dividendSum > 0 && (
                    <tr><td className={`${cellStyle}`}>Dividend Income</td><td className={`${cellStyle} text-right`}>{formatCur(dividendSum)}</td><td className={`${cellStyle}`}></td></tr>
                  )}
                  {Number(data.otherSources.familyPension) > 0 && (
                    <tr><td className={`${cellStyle}`}>Family Pension</td><td className={`${cellStyle} text-right`}>{formatCur(data.otherSources.familyPension)}</td><td className={`${cellStyle}`}></td></tr>
                  )}
                  {familyPensionDeduction > 0 && (
                    <tr><td className={`${cellStyle}`}>Less: Family Pension Standard Deduction</td><td className={`${cellStyle} text-right`}>{formatCur(familyPensionDeduction)}</td><td className={`${cellStyle}`}></td></tr>
                  )}
                  {Number(data.otherSources.anyOtherIncome) > 0 && (
                    <tr><td className={`${cellStyle}`}>Other Taxable Income</td><td className={`${cellStyle}`}></td><td className={`${cellStyle} text-right`}>{formatCur(data.otherSources.anyOtherIncome)}</td></tr>
                  )}
                  <tr>
                    <td className={`${boldHeader}`}>Total Taxable Income</td>
                    <td className={`${cellStyle}`}></td>
                    <td className={`${boldHeader} text-right`}>{formatCur(grossOther)}</td>
                  </tr>
                </tbody>
              </table>

              <PageFooter pageNum={3} />
            </div>

            {/* PAGE 4 */}
            <div className="bg-white w-[794px] h-[1123px] relative px-12 pt-12 pb-24 shadow-sm">
              <div className="flex justify-end text-[13px] mb-4">ITR #2845613</div>
              <h2 className="text-center text-[22px] font-normal mb-4">Exempt Income</h2>
              <h3 className="text-center text-lg mb-4">(Annexure #3)</h3>
              
              <table className={`w-full ${tableBorder} mb-8`}>
                <thead>
                  <tr>
                    <th className={`${boldHeader} text-center`}>Particulars</th>
                    <th className={`${boldHeader} text-center w-[30%]`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${cellStyle}`}>Agricultural income(Less than or equal to 5000)</td>
                    <td className={`${cellStyle} text-right`}>{formatCur(data.exemptIncome.agriculture)}</td>
                  </tr>
                  {Number(data.exemptIncome.ppfInterest) > 0 && (
                    <tr><td className={`${cellStyle}`}>PPF Interest</td><td className={`${cellStyle} text-right`}>{formatCur(data.exemptIncome.ppfInterest)}</td></tr>
                  )}
                  {Number(exemptGifts) > 0 && (
                    <tr><td className={`${cellStyle}`}>Exempt Gifts</td><td className={`${cellStyle} text-right`}>{formatCur(exemptGifts)}</td></tr>
                  )}
                  {Number(data.exemptIncome.otherExempt) > 0 && (
                    <tr><td className={`${cellStyle}`}>Other Exempt Income</td><td className={`${cellStyle} text-right`}>{formatCur(data.exemptIncome.otherExempt)}</td></tr>
                  )}
                  <tr>
                    <td className={`${boldHeader}`}>Total Exempt Income</td>
                    <td className={`${boldHeader} text-right`}>{formatCur(totalExemptIncome)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="text-[10.5px] text-justify text-gray-700 mt-8">
                <strong>Disclaimer:</strong> Your income tax return has been prepared and filed based on the data you provided. If any false or inaccurate deductions or exemption claims were included, the responsibility rests solely with you. If you find discrepancies in the calculations or the tax return form, please contact us at support@aarthika.in within 48 hours for modifications. Post this period, Aarthika and its representatives will not be liable for any discrepancies or issues. We act as an intermediary, processing your information for the tax department.
              </div>

              <PageFooter pageNum={4} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
