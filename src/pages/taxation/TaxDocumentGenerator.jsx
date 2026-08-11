import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useTaxation } from './TaxationContext';
import aarthikaLogo from '../../assets/Aarthika (1).png';

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
  } else {
    const incomeAbove12L = totalIncome - 1200000;
    if (normalTax > incomeAbove12L) {
      rebate87a = normalTax - incomeAbove12L;
    }
  }
  const taxAfterRebate = Math.max(0, totalTax - rebate87a);
  const healthEduCess = taxAfterRebate * 0.04;
  const grossTaxLiability = Math.round(taxAfterRebate + healthEduCess);
  const taxDue = Math.max(0, grossTaxLiability - totalPrepaid);
  const taxRefund = Math.max(0, totalPrepaid - grossTaxLiability);

  const handlePrint = useReactToPrint({
    contentRef: documentRef,
    documentTitle: `Detailed_Computation_${data.clientDetails.pan || 'Client'}`,
  });

  const handleDownload = () => {
    handlePrint();
  };

  // Tax2Win Strict Styling
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '32px' };
  const cellStyle = { padding: '6px 8px', border: '1px solid #000', fontSize: '13px', color: '#000' };
  const boldHeader = { padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#fff', color: '#000', fontSize: '13px', border: '1px solid #000' };
  const mainHeader = { padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#fff', color: '#000', fontSize: '13px', border: '1px solid #000' };
  
  const HeaderLogo = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #000', paddingBottom: '16px' }}>
      <img src={aarthikaLogo} alt="Aarthika" style={{ height: '40px', objectFit: 'contain' }} />
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#000' }}>ITR #2845613</div>
    </div>
  );

  const TitleHeader = ({ title }) => (
    <h1 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '32px', marginTop: '32px' }}>{title}</h1>
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
          <div ref={documentRef} className="block text-black bg-white mx-auto print:mx-0 print:w-full print:bg-white" style={{ width: '180mm', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <style type="text/css" media="print">
              {`
                @page {
                  size: A4 portrait;
                  margin: 15mm;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  background-color: white !important;
                  color: black !important;
                  margin: 0;
                  visibility: visible !important;
                  opacity: 1 !important;
                  display: block !important;
                }
                .html2pdf__page-break {
                  page-break-before: always;
                }
                tr {
                  page-break-inside: avoid;
                }
                h2, h3 {
                  page-break-after: avoid;
                }
              `}
            </style>
            <div className="p-0">
              <HeaderLogo />
              <TitleHeader title="Detailed Computation as per New Tax Regime (ITR-4)" />
              
              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'normal', marginBottom: '24px', marginTop: '40px' }}>Basic Details</h2>
              <table style={tableStyle}>
                <tbody>
                  <tr><td colSpan="4" style={boldHeader}>Personal Information</td></tr>
                  <tr>
                    <td style={{...boldHeader, width: '25%'}}>Name</td>
                    <td colSpan="3" style={cellStyle}>{[data.clientDetails.firstName, data.clientDetails.middleName, data.clientDetails.lastName].filter(Boolean).join(' ') || '--'}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Permanent Address</td>
                    <td colSpan="3" style={cellStyle}>
                      {[data.clientDetails.flatDoor, data.clientDetails.building, data.clientDetails.road, data.clientDetails.area].filter(Boolean).join(', ') || '--'}
                      {data.clientDetails.pincode ? ` - ${data.clientDetails.pincode}` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Father's Name</td>
                    <td colSpan="3" style={cellStyle}>{data.clientDetails.fatherName || '--'}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>PAN</td>
                    <td style={{...cellStyle, width: '25%', textTransform: 'uppercase'}}>{data.clientDetails.pan || 'N/A'}</td>
                    <td style={{...boldHeader, width: '25%'}}>Date of Birth</td>
                    <td style={{...cellStyle, width: '25%'}}>{data.clientDetails.dob || '--'}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>E-Mail</td>
                    <td style={cellStyle}>{data.clientDetails.email || '--'}</td>
                    <td style={boldHeader}>Financial Year</td>
                    <td style={cellStyle}>01-04-2025 to 31-03-2026</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Mobile</td>
                    <td style={cellStyle}>{data.clientDetails.mobile || '--'}</td>
                    <td style={boldHeader}>Assessment Year</td>
                    <td style={cellStyle}>01-04-2026 to 31-03-2027</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Residential Status</td>
                    <td style={cellStyle}>Resident</td>
                    <td style={boldHeader}>Status</td>
                    <td style={cellStyle}>Individual</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Return Type</td>
                    <td style={cellStyle}>Original Return</td>
                    <td style={boldHeader}>Regime</td>
                    <td style={cellStyle}>New Tax Regime</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Return Filed Section</td>
                    <td style={cellStyle}>On Or Before Due Date 139(1)</td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                  </tr>
                </tbody>
              </table>

              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'normal', marginBottom: '24px', marginTop: '48px' }}>Computation of Income</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...mainHeader, textAlign: 'center'}}>Description</th>
                    <th style={{...mainHeader, textAlign: 'center', width: '20%'}}>Amount</th>
                    <th style={{...mainHeader, textAlign: 'center', width: '20%'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={boldHeader}>Income from Salary</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Income from Business (Annexure #1)</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossBusiness)}</td>
                  </tr>
                  <tr>
                    <td style={{...boldHeader, paddingLeft: '32px'}}>Income from Presumptive (Annexure #1)</td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                  </tr>
                  <tr>
                    <td style={{...cellStyle, paddingLeft: '48px'}}>Section 44AD (Annexure #1)</td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(grossBusiness)}</td>
                    <td style={cellStyle}></td>
                  </tr>
                  {(grossStcg > 0 || grossLtcg > 0) && (
                    <tr>
                      <td style={boldHeader}>Income from Capital Gains</td>
                      <td style={cellStyle}></td>
                      <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossStcg + grossLtcg)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={boldHeader}>Income from House Property</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Income from Other Sources (Annexure #2)</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossOther)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Gross Total Income</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossTotalIncome)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Gross Total Income including LTCG u/s 112A</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossTotalIncome)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Less: Deductions</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(totalDeductions)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Taxable Total Income</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(totalIncome)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Tax Payable on Total Income</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(totalTax)}</td>
                  </tr>
                
                  <tr>
                    <td style={cellStyle}>Less: Rebate u/s 87A</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(rebate87a)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Tax Payable After Rebate</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(taxAfterRebate)}</td>
                  </tr>
                  <tr>
                    <td style={{...cellStyle, paddingLeft: '32px'}}>Add: Surcharge</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={{...cellStyle, paddingLeft: '32px'}}>Add: Health & Education Cess</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(healthEduCess)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Gross Tax Liability</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>Balance Tax After Relief</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossTaxLiability)}</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Less: Total Advance Tax Paid</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.prepaidTaxes.advanceTax)}</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Less: Total Self Assessment Tax Paid</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Less: Total TDS Claimed</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(Number(data.prepaidTaxes.tdsSalary) + Number(data.prepaidTaxes.tdsOther))}</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Less: Tax Collected at Source</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.prepaidTaxes.tcs)}</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Add: Interest u/s 234A</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Add: Interest u/s 234B</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Add: Interest u/s 234C</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Add: Late Filing Fees u/s 234F</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>0.00</td>
                  </tr>
                  <tr>
                    <td style={boldHeader}>{taxDue > 0 ? 'Tax Payable' : 'Refund Due'}</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(taxDue > 0 ? taxDue : taxRefund)}</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Exempt Income (Only for reporting purposes)(Annexure #3)</td>
                    <td style={cellStyle}></td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(totalExemptIncome)}</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-center text-[22px] font-normal mb-6 mt-16">Details of Bank Accounts</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...mainHeader, textAlign: 'center'}}>Bank Name</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>IFSC Code</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Account Number</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Account Type</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Selected for Refund?</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.length > 0 ? bankAccounts.map((b, i) => (
                    <tr key={i}>
                      <td style={{...cellStyle, textAlign: 'center'}}>{b.bankName || '--'}</td>
                      <td style={{...cellStyle, textAlign: 'center'}}>{b.ifsc || '--'}</td>
                      <td style={{...cellStyle, textAlign: 'center'}}>{b.accountNumber || '--'}</td>
                      <td style={{...cellStyle, textAlign: 'center'}}>{b.type || '--'}</td>
                      <td style={{...cellStyle, textAlign: 'center'}}>{b.isRefund ? 'Yes' : 'No'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{...cellStyle, textAlign: 'center'}}>No Bank Accounts</td>
                    </tr>
                  )}
                </tbody>
              </table>

              
            </div>

            <div className="mt-12 pt-8 border-t border-gray-300">
              
              <h2 className="text-center text-[22px] font-normal mb-2">Statement of Taxes Paid</h2>
              <p className="text-center text-[13px] mb-4">Details of Tax Deducted at Source on Income Other than Salary<br/>As per Form 16A issued by Deductor(s)</p>
              
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...mainHeader, textAlign: 'center'}}>Name of Deductor</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>TAN of the Deductor</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Deducted Year</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Gross amount on which TDS deducted</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Tax Deducted</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Head of Income</th>
                  </tr>
                </thead>
                <tbody>
                  {taxDeductors.length > 0 ? taxDeductors.map((t, i) => (
                    <tr key={i}>
                      <td style={cellStyle}>{t.deductorName || '--'}</td>
                      <td style={cellStyle}>{t.tan || '--'}</td>
                      <td style={{...cellStyle, textAlign: 'center'}}>2025</td>
                      <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(t.grossAmount)}</td>
                      <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(t.taxDeducted)}</td>
                      <td style={{...cellStyle, textAlign: 'center'}}>{t.headOfIncome || 'Income from Other Source'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{...cellStyle, textAlign: 'center'}}>No Deductors</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" style={{...boldHeader, textAlign: 'right'}}>Total</td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(taxDeductors.reduce((sum, d) => sum + Number(d.grossAmount), 0))}</td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(taxDeductors.reduce((sum, d) => sum + Number(d.taxDeducted), 0))}</td>
                    <td style={cellStyle}></td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-center text-[22px] font-normal mb-2">Income from Business</h2>
              <p className="text-center text-[13px] mb-6">Note: For detailed calculations refer to</p>
              <h3 className="text-center text-lg mb-2">Annexure #1: Section 44AD (Income from Presumptive)</h3>
              
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...mainHeader, textAlign: 'center'}}>Business Name</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Turnover</th>
                    <th style={{...mainHeader, textAlign: 'center'}}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{...cellStyle, textAlign: 'center'}}>{business.businessName || 'Retail Sale of Other Products'}</td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(Number(business.turnoverBank) + Number(business.turnoverCash))}</td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(grossBusiness)}</td>
                  </tr>
                </tbody>
              </table>

              {business.hasFinancialParticulars && (
                <>
                  <h3 className="text-center text-lg mt-6 mb-2 font-semibold text-slate-700">Balance Sheet (as on 31st March)</h3>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={{...mainHeader, textAlign: 'center', width: '50%'}}>Assets</th>
                        <th style={{...mainHeader, textAlign: 'center', width: '50%'}}>Capital and Liabilities</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-0 align-top border-r border-gray-300">
                          <table className="w-full">
                            <tbody>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Fixed Assets</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.fixedGrossBlock)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Stock-in-Trade</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentStock)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Balance with Banks</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentBank)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Cash Balance</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentCash)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Sundry Debtors</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentReceivables)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Loans and Advances</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentLoansGiven)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Investments</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.investmentsST)}</td></tr>
                              <tr><td style={{...cellStyle, border: 'none'}}>Other Assets</td><td style={{...cellStyle, border: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentOther)}</td></tr>
                            </tbody>
                          </table>
                        </td>
                        <td className="p-0 align-top">
                          <table className="w-full">
                            <tbody>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Proprietor's Capital</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.equityCapital)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Reserves & Surplus</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.equityReserves)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Sundry Creditors</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentPayables)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Secured Loans</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.nonCurrentSecured)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Unsecured Loans</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.nonCurrentUnsecured)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Provisions</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentProvisions)}</td></tr>
                              <tr><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none'}}>Advances</td><td style={{...cellStyle, borderBottom: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.nonCurrentAdvances)}</td></tr>
                              <tr><td style={{...cellStyle, border: 'none'}}>Other Liabilities</td><td style={{...cellStyle, border: 'none', textAlign: 'right'}}>{formatCur(business.balanceSheet?.currentOtherLiab)}</td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}


              <h2 className="text-center text-[22px] font-normal mb-4">Income from Other Sources</h2>
              <h3 className="text-center text-lg mb-4">(Annexure #2)</h3>
              
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...mainHeader, textAlign: 'center'}}>Particulars</th>
                    <th style={{...mainHeader, textAlign: 'center', width: '20%'}}>Amount</th>
                    <th style={{...mainHeader, textAlign: 'center', width: '20%'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Number(data.otherSources.savingsInterest) > 0 && (
                    <tr><td style={cellStyle}>Saving Bank Interest</td><td style={cellStyle}></td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.otherSources.savingsInterest)}</td></tr>
                  )}
                  {Number(data.otherSources.fdInterest) > 0 && (
                    <tr><td style={cellStyle}>Interest on Fixed Deposit</td><td style={cellStyle}></td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.otherSources.fdInterest)}</td></tr>
                  )}
                  {dividendSum > 0 && (
                    <tr><td style={cellStyle}>Dividend Income</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(dividendSum)}</td><td style={cellStyle}></td></tr>
                  )}
                  {Number(data.otherSources.familyPension) > 0 && (
                    <tr><td style={cellStyle}>Family Pension</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.otherSources.familyPension)}</td><td style={cellStyle}></td></tr>
                  )}
                  {familyPensionDeduction > 0 && (
                    <tr><td style={cellStyle}>Less: Family Pension Standard Deduction</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(familyPensionDeduction)}</td><td style={cellStyle}></td></tr>
                  )}
                  {Number(data.otherSources.anyOtherIncome) > 0 && (
                    <tr><td style={cellStyle}>Other Taxable Income</td><td style={cellStyle}></td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.otherSources.anyOtherIncome)}</td></tr>
                  )}
                  <tr>
                    <td style={boldHeader}>Total Taxable Income</td>
                    <td style={cellStyle}></td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(grossOther)}</td>
                  </tr>
                </tbody>
              </table>

              
            </div>

            <div className="mt-12 pt-8 border-t border-gray-300">
              
              <h2 className="text-center text-[22px] font-normal mb-4">Exempt Income</h2>
              <h3 className="text-center text-lg mb-4">(Annexure #3)</h3>
              
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...mainHeader, textAlign: 'center'}}>Particulars</th>
                    <th style={{...mainHeader, textAlign: 'center', width: '30%'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  
                  <tr>
                    <td style={cellStyle}>Agricultural income(Less than or equal to 5000)</td>
                    <td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.agriculture)}</td>
                  </tr>
                  {Number(data.exemptIncome.ppfInterest) > 0 && (
                    <tr><td style={cellStyle}>PPF Interest</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.ppfInterest)}</td></tr>
                  )}
                  {Number(data.exemptIncome.insuranceMaturity) > 0 && (
                    <tr><td style={cellStyle}>Insurance Maturity / Bonus</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.insuranceMaturity)}</td></tr>
                  )}
                  {Number(data.exemptIncome.npsWithdrawal) > 0 && (
                    <tr><td style={cellStyle}>NPS / UPS Withdrawal</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.npsWithdrawal)}</td></tr>
                  )}
                  {Number(data.exemptIncome.pfMaturity) > 0 && (
                    <tr><td style={cellStyle}>Provident Fund Maturity</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.pfMaturity)}</td></tr>
                  )}
                  {Number(data.exemptIncome.hufShare) > 0 && (
                    <tr><td style={cellStyle}>Share from HUF</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.hufShare)}</td></tr>
                  )}
                  {Number(data.exemptIncome.ssyMaturity) > 0 && (
                    <tr><td style={cellStyle}>Sukanya Samriddhi Yojana (SSY)</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.ssyMaturity)}</td></tr>
                  )}
                  {Number(exemptGifts) > 0 && (
                    <tr><td style={cellStyle}>Exempt Gifts</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(exemptGifts)}</td></tr>
                  )}
                  {Number(data.exemptIncome.otherExempt) > 0 && (
                    <tr><td style={cellStyle}>Other Exempt Income</td><td style={{...cellStyle, textAlign: 'right'}}>{formatCur(data.exemptIncome.otherExempt)}</td></tr>
                  )}
<tr>
                    <td style={boldHeader}>Total Exempt Income</td>
                    <td style={{...boldHeader, textAlign: 'right'}}>{formatCur(totalExemptIncome)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="text-[10.5px] text-justify text-gray-700 mt-8">
                <strong>Disclaimer:</strong> Your income tax return has been prepared and filed based on the data you provided. If any false or inaccurate deductions or exemption claims were included, the responsibility rests solely with you. If you find discrepancies in the calculations or the tax return form, please contact us at support@aarthika.in within 48 hours for modifications. Post this period, Aarthika and its representatives will not be liable for any discrepancies or issues. We act as an intermediary, processing your information for the tax department.
              </div>

              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
