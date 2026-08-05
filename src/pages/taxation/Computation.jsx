import React, { useMemo, useState } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';
import TaxDocumentGenerator from './TaxDocumentGenerator';

// New Regime Tax Slabs (FY 2024-25 / AY 2025-26 onwards based on July 2024 Budget)
const calculateSlabTax = (income) => {
  let tax = 0;
  if (income > 1500000) {
    tax += (income - 1500000) * 0.30;
    income = 1500000;
  }
  if (income > 1200000) {
    tax += (income - 1200000) * 0.20;
    income = 1200000;
  }
  if (income > 1000000) {
    tax += (income - 1000000) * 0.15;
    income = 1000000;
  }
  if (income > 700000) {
    tax += (income - 700000) * 0.10;
    income = 700000;
  }
  if (income > 300000) {
    tax += (income - 300000) * 0.05;
  }
  return tax;
};

export default function Computation() {
  const { taxData } = useTaxation();
  const navigate = useNavigate();
  const { business, capitalGains, otherSources, bfla, deductions, prepaidTaxes } = taxData;
  const [showGenerator, setShowGenerator] = useState(false);

  const computation = useMemo(() => {
    // 1. Calculate Gross Incomes
    const grossBusiness = Number(business.profitBank) + Number(business.profitCash);
    const grossStcg = Object.values(capitalGains.stcg).reduce((sum, val) => sum + Number(val), 0);
    const grossLtcg = Object.values(capitalGains.ltcg).reduce((sum, val) => sum + Number(val), 0);
    
    const dividendSum = Object.values(otherSources.dividend).reduce((sum, val) => sum + Number(val), 0);
    const totalGifts = Number(otherSources.gifts.monetary) + Number(otherSources.gifts.movable) + Number(otherSources.gifts.immovable);
    const taxableGifts = (!otherSources.gifts.isExemptOccasion && totalGifts > 50000) ? totalGifts : 0;

    const grossOther = Number(otherSources.savingsInterest) + Number(otherSources.fdInterest) + 
                       Number(otherSources.taxRefundInterest) + Number(otherSources.bondsInterest) +
                       Number(otherSources.epfInterest) + Number(otherSources.loansInterest) +
                       Number(otherSources.anyOtherIncome) + dividendSum + taxableGifts;

    // 2. Apply BFLA (Brought Forward Loss Adjustments)
    const taxableBusiness = Math.max(0, grossBusiness - Number(bfla.businessLoss));
    
    let remainingStcgLoss = Number(bfla.stcgLoss);
    const taxableStcg = Math.max(0, grossStcg - remainingStcgLoss);
    remainingStcgLoss = Math.max(0, remainingStcgLoss - grossStcg); // Used up against STCG

    const taxableLtcg = Math.max(0, grossLtcg - Number(bfla.ltcgLoss) - remainingStcgLoss);
    const taxableOther = grossOther;

    const grossTotalIncome = taxableBusiness + taxableStcg + taxableLtcg + taxableOther;

    // 3. Apply Chapter VI-A Deductions
    const totalDeductions = Number(deductions.sec80CCD2) + Number(deductions.sec80CCH);
    const totalIncome = Math.max(0, grossTotalIncome - totalDeductions);
    
    // Assume deductions reduce normal income first
    const normalIncomeBeforeDed = taxableBusiness + taxableOther;
    const normalIncome = Math.max(0, normalIncomeBeforeDed - totalDeductions);

    // 4. Tax Calculation
    const taxOnNormalIncome = calculateSlabTax(normalIncome);
    
    // STCG 111A = 20%, LTCG 112A = 12.5% over 1.25L
    const taxOnStcg = taxableStcg * 0.20;
    const ltcgAboveExemption = Math.max(0, taxableLtcg - 125000);
    const taxOnLtcg = ltcgAboveExemption * 0.125;

    let totalTaxBase = taxOnNormalIncome + taxOnStcg + taxOnLtcg;

    // 87A Rebate logic (New Budget: 0 tax up to 12 Lakhs income)
    let rebate87A = 0;
    if (totalIncome <= 1200000) {
      rebate87A = totalTaxBase; 
    }

    const taxAfterRebate = Math.max(0, totalTaxBase - rebate87A);
    const cess = taxAfterRebate * 0.04;
    const finalTaxLiability = Math.round(taxAfterRebate + cess);

    // 5. Taxes Paid & Final Due
    const totalPrepaid = Number(prepaidTaxes.advanceTax) + Number(prepaidTaxes.tdsSalary) + Number(prepaidTaxes.tdsOther) + Number(prepaidTaxes.tcs);
    const taxDues = finalTaxLiability - totalPrepaid;

    return {
      breakdown: [
        { head: 'Business & Profession', gross: grossBusiness, bfla: bfla.businessLoss, taxable: taxableBusiness },
        { head: 'Capital Gains (STCG)', gross: grossStcg, bfla: bfla.stcgLoss, taxable: taxableStcg },
        { head: 'Capital Gains (LTCG)', gross: grossLtcg, bfla: bfla.ltcgLoss, taxable: taxableLtcg },
        { head: 'Other Sources', gross: grossOther, bfla: 0, taxable: taxableOther },
      ],
      grossTotalIncome,
      totalDeductions,
      totalIncome,
      normalIncome,
      taxOnNormalIncome,
      taxOnStcg,
      taxOnLtcg,
      totalTaxBase,
      rebate87A,
      cess,
      finalTaxLiability,
      totalPrepaid,
      taxDues
    };
  }, [business, capitalGains, otherSources, bfla, deductions, prepaidTaxes]);

  const TableRow = ({ head, total, bfla, taxable, isTotal }) => (
    <div className={`grid grid-cols-4 gap-4 px-4 py-3 text-sm ${isTotal ? 'font-bold bg-[#1a1a1a] border-t border-gray-700 text-white' : 'text-gray-300 border-b border-gray-800'}`}>
      <div>{head}</div>
      <div className="text-right">₹{total.toLocaleString('en-IN')}</div>
      <div className="text-right text-red-400">{bfla > 0 ? `(₹${bfla.toLocaleString('en-IN')})` : '-'}</div>
      <div className="text-right">₹{taxable.toLocaleString('en-IN')}</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tax Computation Summary</h2>
        <p className="text-gray-400">Review the income breakdown, accruals, and final tax liability under the New Tax Regime.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Breakdowns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Income Breakdown Table */}
          <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-white">Income Breakdown</h3>
            </div>
            <div className="grid grid-cols-4 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#0f0f0f] border-b border-gray-800">
              <div>Head of Income</div>
              <div className="text-right">Total Income</div>
              <div className="text-right">BFLA</div>
              <div className="text-right">Taxable Income</div>
            </div>
            
            {computation.breakdown.map((row, idx) => (
              <TableRow key={idx} head={row.head} total={row.gross} bfla={row.bfla} taxable={row.taxable} />
            ))}
            
            <TableRow 
              head="Gross Total Income" 
              total={computation.breakdown.reduce((sum, r) => sum + r.gross, 0)} 
              bfla={computation.breakdown.reduce((sum, r) => sum + Number(r.bfla), 0)} 
              taxable={computation.grossTotalIncome} 
              isTotal={true} 
            />
            <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-bold bg-[#1a1a1a] border-t border-gray-700 text-red-400">
              <div colSpan="3">Less: Chapter VI-A Deductions</div>
              <div></div>
              <div></div>
              <div className="text-right">-₹{computation.totalDeductions.toLocaleString('en-IN')}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-black bg-[#121212] text-white">
              <div colSpan="3">TOTAL NET INCOME</div>
              <div></div>
              <div></div>
              <div className="text-right">₹{computation.totalIncome.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Accrual Summary (Capital Gains/Dividend) */}
          <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
             <div className="px-4 py-3 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-white">Accrual Summary (For Advance Tax)</h3>
            </div>
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-[#0f0f0f] border-b border-gray-800 text-right">
              <div className="text-left">Source</div>
              <div>Up to 15 Jun</div>
              <div>16 Jun - 15 Sep</div>
              <div>16 Sep - 15 Dec</div>
              <div>16 Dec - 15 Mar</div>
              <div>16 Mar - 31 Mar</div>
            </div>
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs text-gray-300 text-right border-b border-gray-800/50">
              <div className="text-left">STCG @ 20%</div>
              <div>₹{Number(capitalGains.stcg.q1).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.stcg.q2).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.stcg.q3).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.stcg.q4).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.stcg.q5).toLocaleString('en-IN')}</div>
            </div>
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs text-gray-300 text-right border-b border-gray-800/50">
              <div className="text-left">LTCG @ 12.5%</div>
              <div>₹{Number(capitalGains.ltcg.q1).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.ltcg.q2).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.ltcg.q3).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.ltcg.q4).toLocaleString('en-IN')}</div>
              <div>₹{Number(capitalGains.ltcg.q5).toLocaleString('en-IN')}</div>
            </div>
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs text-gray-300 text-right">
              <div className="text-left">Dividend</div>
              <div>₹{Number(otherSources.dividend.q1).toLocaleString('en-IN')}</div>
              <div>₹{Number(otherSources.dividend.q2).toLocaleString('en-IN')}</div>
              <div>₹{Number(otherSources.dividend.q3).toLocaleString('en-IN')}</div>
              <div>₹{Number(otherSources.dividend.q4).toLocaleString('en-IN')}</div>
              <div>₹{Number(otherSources.dividend.q5).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Tax Card & Document Generation */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 rounded-xl border border-blue-900/50 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Total Tax & Cess</h3>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-black text-white">₹{computation.finalTaxLiability.toLocaleString('en-IN')}</span>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider mt-4">Prepaid Taxes</h3>
            <div className="flex items-end gap-2 mb-6 pb-4 border-b border-gray-700/50">
              <span className="text-2xl font-black text-green-400">₹{computation.totalPrepaid.toLocaleString('en-IN')}</span>
            </div>

            <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">
              {computation.taxDues > 0 ? 'Tax Payable' : 'Tax Refund'}
            </h3>
            <div className="flex items-end gap-2 mb-6">
              <span className={`text-4xl font-black ${computation.taxDues > 0 ? 'text-red-400' : 'text-green-400'}`}>
                ₹{Math.abs(computation.taxDues).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Tax on Normal Income</span>
                <span className="text-white">₹{computation.taxOnNormalIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax on STCG (20%)</span>
                <span className="text-white">₹{computation.taxOnStcg.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax on LTCG (12.5%)</span>
                <span className="text-white">₹{computation.taxOnLtcg.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="my-2 border-t border-gray-700/50"></div>
              
              <div className="flex justify-between text-gray-400">
                <span>Total Tax Base</span>
                <span className="text-white">₹{computation.totalTaxBase.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Less: Rebate 87A (New Regime)</span>
                <span className="text-green-400">-₹{computation.rebate87A.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Add: Health & Ed Cess (4%)</span>
                <span className="text-white">₹{computation.cess.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] p-5 rounded-xl border border-gray-800">
            <h3 className="text-white font-medium mb-2">Documents</h3>
            <p className="text-xs text-gray-500 mb-4">Generate professional PDFs of the P&L, Balance Sheet, and Tax Computation.</p>
            <button 
              onClick={() => setShowGenerator(true)}
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Generate Documents (PDF)
            </button>
          </div>
        </div>
      </div>
      
      {showGenerator && <TaxDocumentGenerator onClose={() => setShowGenerator(false)} />}
    </div>
  );
}
