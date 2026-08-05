import React, { useMemo } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

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
  const { business, capitalGains, otherSources, bfla } = taxData;

  const computation = useMemo(() => {
    // 1. Calculate Gross Incomes
    const grossBusiness = Number(business.profitBank) + Number(business.profitCash);
    const grossStcg = Number(capitalGains.stcg);
    const grossLtcg = Number(capitalGains.ltcg);
    
    const dividendSum = Object.values(otherSources.dividend).reduce((sum, val) => sum + Number(val), 0);
    const grossOther = Number(otherSources.savingsInterest) + Number(otherSources.fdInterest) + 
                       Number(otherSources.taxRefundInterest) + Number(otherSources.anyOtherIncome) + dividendSum;

    // 2. Apply BFLA (Brought Forward Loss Adjustments)
    const taxableBusiness = Math.max(0, grossBusiness - Number(bfla.businessLoss));
    
    let remainingStcgLoss = Number(bfla.stcgLoss);
    const taxableStcg = Math.max(0, grossStcg - remainingStcgLoss);
    remainingStcgLoss = Math.max(0, remainingStcgLoss - grossStcg); // Used up against STCG

    // LTCL can only be set off against LTCG. STCL can be set off against STCG & LTCG.
    const taxableLtcg = Math.max(0, grossLtcg - Number(bfla.ltcgLoss) - remainingStcgLoss);
    const taxableOther = grossOther; // Losses usually not set off against other sources like dividend easily

    const totalIncome = taxableBusiness + taxableStcg + taxableLtcg + taxableOther;
    const normalIncome = taxableBusiness + taxableOther;

    // 3. Tax Calculation
    const taxOnNormalIncome = calculateSlabTax(normalIncome);
    
    // New capital gains rates (Budget 2024): STCG 111A = 20%, LTCG 112A = 12.5% over 1.25L
    const taxOnStcg = taxableStcg * 0.20;
    const ltcgAboveExemption = Math.max(0, taxableLtcg - 125000);
    const taxOnLtcg = ltcgAboveExemption * 0.125;

    let totalTaxBase = taxOnNormalIncome + taxOnStcg + taxOnLtcg;

    // 87A Rebate under New Regime (Up to 7L income, rebate up to 25k)
    let rebate87A = 0;
    if (totalIncome <= 700000) {
      // Simplification: rebate is max 25000 against normal tax (and STCG 111A, but not LTCG 112A usually, though rules vary)
      rebate87A = Math.min(totalTaxBase, 25000); 
    }

    const taxAfterRebate = Math.max(0, totalTaxBase - rebate87A);
    const cess = taxAfterRebate * 0.04;
    const finalTaxLiability = Math.round(taxAfterRebate + cess);

    return {
      breakdown: [
        { head: 'Business & Profession', gross: grossBusiness, bfla: bfla.businessLoss, taxable: taxableBusiness },
        { head: 'Capital Gains (STCG)', gross: grossStcg, bfla: bfla.stcgLoss, taxable: taxableStcg },
        { head: 'Capital Gains (LTCG)', gross: grossLtcg, bfla: bfla.ltcgLoss, taxable: taxableLtcg },
        { head: 'Other Sources', gross: grossOther, bfla: 0, taxable: taxableOther },
      ],
      totalIncome,
      normalIncome,
      taxOnNormalIncome,
      taxOnStcg,
      taxOnLtcg,
      totalTaxBase,
      rebate87A,
      cess,
      finalTaxLiability
    };
  }, [business, capitalGains, otherSources, bfla]);

  const TableRow = ({ head, total, bfla, taxable, isTotal }) => (
    <div className={`grid grid-cols-4 gap-4 px-4 py-3 text-sm ${isTotal ? 'font-bold bg-[#1a1a1a] border-t border-gray-700 text-white' : 'text-gray-300 border-b border-gray-800'}`}>
      <div>{head}</div>
      <div className="text-right">₹{total.toLocaleString('en-IN')}</div>
      <div className="text-right text-red-400">{bfla > 0 ? `(₹${bfla.toLocaleString('en-IN')})` : '-'}</div>
      <div className="text-right">₹{taxable.toLocaleString('en-IN')}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tax Computation Summary</h2>
        <p className="text-gray-400">Review the income breakdown and final tax liability under the New Tax Regime.</p>
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
              head="Total" 
              total={computation.breakdown.reduce((sum, r) => sum + r.gross, 0)} 
              bfla={computation.breakdown.reduce((sum, r) => sum + Number(r.bfla), 0)} 
              taxable={computation.totalIncome} 
              isTotal={true} 
            />
          </div>

          {/* Accrual Summary for Dividends (Advance Tax Preview) */}
          <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
             <div className="px-4 py-3 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-white">Accrual Summary (Dividend)</h3>
            </div>
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-[#0f0f0f] border-b border-gray-800 text-right">
              <div className="text-left">Source</div>
              <div>Up to 15 Jun</div>
              <div>16 Jun - 15 Sep</div>
              <div>16 Sep - 15 Dec</div>
              <div>16 Dec - 15 Mar</div>
              <div>16 Mar - 31 Mar</div>
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
            {/* Decorative background circle */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="text-sm font-semibold text-blue-400 mb-4 uppercase tracking-wider">Final Tax Liability</h3>
            
            <div className="flex items-end gap-2 mb-6">
              <span className="text-5xl font-black text-white">₹{computation.finalTaxLiability.toLocaleString('en-IN')}</span>
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
                <span>Less: Rebate 87A</span>
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
              onClick={() => alert("PDF Generation will be implemented in Phase 7!")}
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Generate Documents (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
