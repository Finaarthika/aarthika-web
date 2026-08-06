import React, { useState, useMemo } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';
import TaxDocumentGenerator from './TaxDocumentGenerator';

export default function Computation() {
  const { taxData } = useTaxation();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);

  // Re-use logic from previous computation
  const computation = useMemo(() => {
    let grossTotalIncome = 0;
    
    // Business Income
    const bizProfit = (Number(taxData.business.profitBank) || 0) + (Number(taxData.business.profitCash) || 0);
    const bflaBiz = Math.min(bizProfit, Number(taxData.bfla.businessLoss) || 0);
    const netBiz = Math.max(0, bizProfit - bflaBiz);
    grossTotalIncome += netBiz;

    // Capital Gains
    const totalStcg = Object.values(taxData.capitalGains.stcg).reduce((a,b) => a + Number(b), 0);
    const totalLtcg = Object.values(taxData.capitalGains.ltcg).reduce((a,b) => a + Number(b), 0);
    
    // BFLA Capital Gains
    const bflaStcg = Math.min(totalStcg, Number(taxData.bfla.stcgLoss) || 0);
    const remainingStcgLoss = Math.max(0, (Number(taxData.bfla.stcgLoss) || 0) - bflaStcg);
    
    const bflaLtcg = Math.min(totalLtcg, (Number(taxData.bfla.ltcgLoss) || 0) + remainingStcgLoss);
    
    const netStcg = Math.max(0, totalStcg - bflaStcg);
    const netLtcg = Math.max(0, totalLtcg - bflaLtcg);
    grossTotalIncome += netStcg + netLtcg;

    // Other Sources
    const os = taxData.otherSources;
    const totalDividend = Object.values(os.dividend).reduce((a,b) => a + Number(b), 0);
    const totalGifts = Number(os.gifts.monetary) + Number(os.gifts.movable) + Number(os.gifts.immovable);
    const taxableGifts = (!os.gifts.isExemptOccasion && totalGifts > 50000) ? totalGifts : 0;
    
    const totalOtherSources = 
      (Number(os.savingsInterest) || 0) + (Number(os.fdInterest) || 0) + 
      (Number(os.taxRefundInterest) || 0) + (Number(os.bondsInterest) || 0) + 
      (Number(os.epfInterest) || 0) + (Number(os.loansInterest) || 0) +
      totalDividend + taxableGifts +
      (Number(os.familyPension) || 0) * (2/3) + // Applying standard deduction for family pension
      (Number(os.anyOtherIncome) || 0);
    
    grossTotalIncome += totalOtherSources;

    // Deductions
    const d = taxData.deductions;
    const totalDeductions = (Number(d.sec80CCD2) || 0) + (Number(d.sec80CCH) || 0);

    const totalIncome = Math.max(0, grossTotalIncome - totalDeductions);

    // Tax Calculation (New Regime rules for AY 2026-27 / FY 2025-26)
    // 0-3L: Nil, 3-7L: 5%, 7-10L: 10%, 10-12L: 15%, 12-15L: 20%, >15L: 30%
    const calculateNewRegimeTax = (income) => {
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

    const normalIncome = totalIncome - netStcg - netLtcg;
    const taxOnNormalIncome = calculateNewRegimeTax(normalIncome);
    const taxOnStcg = netStcg * 0.20; // 111A
    const taxOnLtcg = Math.max(0, netLtcg - 125000) * 0.125; // 112A with 1.25L exemption

    const totalTaxBase = taxOnNormalIncome + taxOnStcg + taxOnLtcg;
    
    // 87A Rebate (up to 7 Lakhs, max 25000)
    let rebate87A = 0;
    if (totalIncome <= 700000) {
      rebate87A = Math.min(totalTaxBase, 25000);
    }
    // Marginal relief for 87A
    else if (totalIncome > 700000 && totalIncome <= 727777) {
      const taxAbove7L = totalTaxBase;
      const incomeAbove7L = totalIncome - 700000;
      if (taxAbove7L > incomeAbove7L) {
        rebate87A = taxAbove7L - incomeAbove7L;
      }
    }

    const taxAfterRebate = Math.max(0, totalTaxBase - rebate87A);
    const cess = taxAfterRebate * 0.04;
    const finalTaxLiability = taxAfterRebate + cess;

    const totalPrepaid = taxData.taxDeductors.reduce((sum, d) => sum + (Number(d.taxDeducted) || 0), 0);
    const taxDues = finalTaxLiability - totalPrepaid;

    return {
      grossTotalIncome,
      totalDeductions,
      totalIncome,
      taxOnNormalIncome,
      taxOnStcg,
      taxOnLtcg,
      totalTaxBase,
      rebate87A,
      cess,
      finalTaxLiability,
      totalPrepaid,
      taxDues,
      breakdown: [
        { head: 'Income from Business/Profession', gross: bizProfit, bfla: bflaBiz, net: netBiz },
        { head: 'Short Term Capital Gains (111A)', gross: totalStcg, bfla: bflaStcg, net: netStcg },
        { head: 'Long Term Capital Gains (112A)', gross: totalLtcg, bfla: bflaLtcg, net: netLtcg },
        { head: 'Income from Other Sources', gross: totalOtherSources, bfla: 0, net: totalOtherSources }
      ].filter(item => item.gross > 0 || item.bfla > 0)
    };
  }, [taxData]);

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Review & Finalize Computation</h1>
        <p className="text-[15px] text-gray-500 font-medium">Your provisional tax computation is ready.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Computation Breakdown */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-200">
              <h3 className="font-bold text-lg text-slate-800">Income Breakdown</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {computation.breakdown.map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{row.head}</p>
                    {row.bfla > 0 && <p className="text-xs text-red-500 mt-1">Less BFLA Set-off: -₹{row.bfla.toLocaleString('en-IN')}</p>}
                  </div>
                  <p className="font-bold text-slate-800">₹{row.net.toLocaleString('en-IN')}</p>
                </div>
              ))}
              
              <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-lg mt-4">
                <p className="font-bold text-slate-700 text-sm">Gross Total Income</p>
                <p className="font-bold text-slate-800">₹{computation.grossTotalIncome.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-red-600">
                <p className="font-semibold text-sm">Less: Chapter VI-A Deductions</p>
                <p className="font-bold">-₹{computation.totalDeductions.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex justify-between items-center py-4 bg-green-50 px-4 rounded-lg mt-2 border border-green-200">
                <p className="font-black text-green-800">TOTAL NET INCOME</p>
                <p className="font-black text-green-800 text-lg">₹{computation.totalIncome.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tax Card */}
        <div>
          <div className="bg-gradient-to-br from-[#1b7a43] to-[#12582f] rounded-2xl shadow-lg border border-green-800/30 overflow-hidden h-full flex flex-col">
            <div className="p-6 flex-1 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
              
              <h3 className="text-sm font-semibold text-green-100 mb-1 uppercase tracking-wider">Total Tax & Cess</h3>
              <p className="text-3xl font-black mb-6">₹{computation.finalTaxLiability.toLocaleString('en-IN')}</p>

              <h3 className="text-sm font-semibold text-green-100 mb-1 uppercase tracking-wider">Prepaid Taxes</h3>
              <p className="text-xl font-bold mb-6 text-green-200">₹{computation.totalPrepaid.toLocaleString('en-IN')}</p>

              <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-6 backdrop-blur-sm">
                <h3 className="text-xs font-semibold text-green-100 mb-1 uppercase tracking-wider">
                  {computation.taxDues > 0 ? 'Net Tax Payable' : 'Tax Refund'}
                </h3>
                <p className="text-2xl font-black">
                  ₹{Math.abs(computation.taxDues).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="space-y-2 text-[13px] opacity-90">
                <div className="flex justify-between">
                  <span>Tax on Normal Income</span>
                  <span>₹{computation.taxOnNormalIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax on STCG (20%)</span>
                  <span>₹{computation.taxOnStcg.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax on LTCG (12.5%)</span>
                  <span>₹{computation.taxOnLtcg.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                  <span>Rebate 87A (New Regime)</span>
                  <span className="text-green-300">-₹{computation.rebate87A.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health & Ed Cess (4%)</span>
                  <span>₹{computation.cess.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100 text-center">
        <h3 className="font-bold text-lg text-slate-800 mb-2">Finalize Your Return</h3>
        <p className="text-[14px] text-gray-500 mb-6">Generate professional PDFs of your Computation, Balance Sheet, and P&L for your records.</p>
        <button 
          onClick={() => setShowGenerator(true)}
          className="bg-[#1b7a43] text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Generate Documents (PDF)
        </button>
      </div>

      <div className="flex justify-start mt-8">
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </div>
      
      {showGenerator && <TaxDocumentGenerator onClose={() => setShowGenerator(false)} />}
    </div>
  );
}
