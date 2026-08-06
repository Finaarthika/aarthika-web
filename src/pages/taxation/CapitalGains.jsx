import React, { useEffect } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const getQuarter = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const m = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  
  if ((m >= 4 && m <= 5) || (m === 6 && day <= 15)) return 'q1'; // Apr 1 - Jun 15
  if ((m === 6 && day > 15) || m === 7 || m === 8 || (m === 9 && day <= 15)) return 'q2'; // Jun 16 - Sep 15
  if ((m === 9 && day > 15) || m === 10 || m === 11 || (m === 12 && day <= 15)) return 'q3'; // Sep 16 - Dec 15
  if ((m === 12 && day > 15) || m === 1 || m === 2 || (m === 3 && day <= 15)) return 'q4'; // Dec 16 - Mar 15
  if (m === 3 && day > 15) return 'q5'; // Mar 16 - Mar 31
  return 'q5'; // fallback
};

const getCapitalGainType = (buyDate, sellDate, type) => {
  if (!buyDate || !sellDate) return 'stcg';
  const b = new Date(buyDate);
  const s = new Date(sellDate);
  const diffTime = Math.abs(s - b);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Equity/MF holds 12 months for LTCG
  if (type === 'Equity/MF' && diffDays > 365) return 'ltcg';
  return 'stcg';
};

export default function CapitalGains() {
  const { taxData, updateArrayData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const cgTransactions = taxData.cgTransactions || [];

  useEffect(() => {
    // Auto-calculate the totals into the context object
    const stcgTotals = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
    const ltcgTotals = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };

    cgTransactions.forEach(tx => {
      const profit = (Number(tx.sellValue) || 0) - (Number(tx.buyValue) || 0) - (Number(tx.expenses) || 0);
      if (profit === 0) return;
      
      const type = getCapitalGainType(tx.buyDate, tx.sellDate, tx.type);
      const q = getQuarter(tx.sellDate);
      
      if (q) {
        if (type === 'stcg') stcgTotals[q] += profit;
        else ltcgTotals[q] += profit;
      }
    });

    Object.keys(stcgTotals).forEach(q => updateNestedTaxData('capitalGains', 'stcg', q, stcgTotals[q]));
    Object.keys(ltcgTotals).forEach(q => updateNestedTaxData('capitalGains', 'ltcg', q, ltcgTotals[q]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cgTransactions]);

  const handleAddRow = () => {
    const newId = cgTransactions.length > 0 ? Math.max(...cgTransactions.map(t => t.id)) + 1 : 1;
    updateArrayData('cgTransactions', [
      ...cgTransactions, 
      { id: newId, assetName: '', isin: '', type: 'Equity/MF', buyDate: '', sellDate: '', buyValue: 0, sellValue: 0, expenses: 0 }
    ]);
  };

  const handleRemoveRow = (id) => {
    updateArrayData('cgTransactions', cgTransactions.filter(t => t.id !== id));
  };

  const handleChange = (id, field, value) => {
    updateArrayData('cgTransactions', cgTransactions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const totalStcg = Object.values(taxData.capitalGains.stcg).reduce((a, b) => a + Number(b), 0);
  const totalLtcg = Object.values(taxData.capitalGains.ltcg).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Capital Gains (Schedule CG)</h2>
          <p className="text-gray-400">Add your individual trades. We will automatically classify STCG/LTCG and calculate advance tax quarters.</p>
        </div>
        <button 
          onClick={handleAddRow}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      <div className="space-y-6 mb-8">
        {cgTransactions.length === 0 ? (
          <div className="bg-[#1a1a1a] p-12 rounded-xl border border-gray-800 text-center">
            <p className="text-gray-500 mb-4">No capital gains transactions added yet. Click to add a stock or mutual fund trade.</p>
            <button 
              onClick={handleAddRow}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
            >
              Add First Trade
            </button>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#242424] border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Asset Details</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Buy & Sell Values</th>
                    <th className="p-4">Gain/Loss</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {cgTransactions.map((row) => {
                    const profit = (Number(row.sellValue) || 0) - (Number(row.buyValue) || 0) - (Number(row.expenses) || 0);
                    const gainType = getCapitalGainType(row.buyDate, row.sellDate, row.type);
                    return (
                      <tr key={row.id} className="hover:bg-[#1f1f1f] transition-colors">
                        <td className="p-4 align-top w-1/4">
                          <input
                            type="text"
                            placeholder="Asset Name (e.g., RIL)"
                            className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={row.assetName}
                            onChange={(e) => handleChange(row.id, 'assetName', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="ISIN (Optional)"
                            className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-gray-400 p-2 mb-2 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                            value={row.isin || ''}
                            onChange={(e) => handleChange(row.id, 'isin', e.target.value)}
                          />
                          <select
                            className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-gray-400 p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={row.type}
                            onChange={(e) => handleChange(row.id, 'type', e.target.value)}
                          >
                            <option value="Equity/MF">Equity / Equity MF</option>
                            <option value="Debt/Other">Debt MF / Unlisted</option>
                          </select>
                        </td>
                        <td className="p-4 align-top w-1/5">
                          <div className="mb-2">
                            <label className="text-xs text-gray-500 block mb-1">Buy Date</label>
                            <input
                              type="date"
                              className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                              value={row.buyDate}
                              onChange={(e) => handleChange(row.id, 'buyDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Sell Date</label>
                            <input
                              type="date"
                              className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                              value={row.sellDate}
                              onChange={(e) => handleChange(row.id, 'sellDate', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-4 align-top w-1/4">
                          <input
                            type="number"
                            placeholder="Buy Value (₹)"
                            className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={row.buyValue || ''}
                            onChange={(e) => handleChange(row.id, 'buyValue', Number(e.target.value))}
                          />
                          <input
                            type="number"
                            placeholder="Sell Value (₹)"
                            className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={row.sellValue || ''}
                            onChange={(e) => handleChange(row.id, 'sellValue', Number(e.target.value))}
                          />
                          <input
                            type="number"
                            placeholder="Transfer Exp (₹)"
                            className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={row.expenses || ''}
                            onChange={(e) => handleChange(row.id, 'expenses', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-4 align-top">
                          {row.buyDate && row.sellDate ? (
                            <div className={`p-3 rounded border ${profit >= 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                              <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{profit.toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase">
                                {gainType === 'stcg' ? 'Short Term (STCG)' : 'Long Term (LTCG)'}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1 uppercase">
                                Qtr: {getQuarter(row.sellDate)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Enter dates to calculate gain...</p>
                          )}
                        </td>
                        <td className="p-4 align-top text-center">
                          <button 
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-red-500 hover:text-red-400 p-2 text-xl font-bold"
                            title="Remove Row"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="bg-[#242424] p-4 flex justify-between items-center border-t border-gray-800">
              <span className="text-gray-400 font-medium text-sm">Aggregate STCG: <span className="text-white ml-2">₹{totalStcg.toLocaleString('en-IN')}</span></span>
              <span className="text-gray-400 font-medium text-sm">Aggregate LTCG: <span className="text-white ml-2">₹{totalLtcg.toLocaleString('en-IN')}</span></span>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors"
          >
            &larr; Back
          </button>
          <button 
            onClick={() => {
              if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
              else if (taxData.incomes.hasExemptIncome) navigate('/taxation/exempt-income');
              else if (taxData.incomes.hasDeductions) navigate('/taxation/deductions');
              else if (taxData.incomes.hasPrepaidTaxes) navigate('/taxation/taxes-paid');
              else navigate('/taxation/adjustments');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            Save & Continue
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
