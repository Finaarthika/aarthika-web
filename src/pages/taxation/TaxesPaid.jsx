import React, { useEffect } from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

export default function TaxesPaid() {
  const { taxData, updateArrayData, updateTaxData } = useTaxation();
  const navigate = useNavigate();
  const taxDeductors = taxData.taxDeductors || [];

  // Whenever taxDeductors changes, auto-calculate the legacy prepaidTaxes totals for backward compatibility
  useEffect(() => {
    let advanceTax = 0;
    let tdsSalary = 0;
    let tdsOther = 0;
    let tcs = 0;

    taxDeductors.forEach(d => {
      const amt = Number(d.taxDeducted) || 0;
      if (d.type === 'Advance Tax') advanceTax += amt;
      else if (d.type === 'TDS on Salary') tdsSalary += amt;
      else if (d.type === 'TDS on Other Income') tdsOther += amt;
      else if (d.type === 'TCS') tcs += amt;
    });

    updateTaxData('prepaidTaxes', 'advanceTax', advanceTax);
    updateTaxData('prepaidTaxes', 'tdsSalary', tdsSalary);
    updateTaxData('prepaidTaxes', 'tdsOther', tdsOther);
    updateTaxData('prepaidTaxes', 'tcs', tcs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxDeductors]);

  const handleAddRow = () => {
    const newId = taxDeductors.length > 0 ? Math.max(...taxDeductors.map(d => d.id)) + 1 : 1;
    updateArrayData('taxDeductors', [
      ...taxDeductors, 
      { id: newId, type: 'TDS on Other Income', deductorName: '', tan: '', grossAmount: 0, taxDeducted: 0, headOfIncome: 'Other Sources' }
    ]);
  };

  const handleRemoveRow = (id) => {
    updateArrayData('taxDeductors', taxDeductors.filter(d => d.id !== id));
  };

  const handleChange = (id, field, value) => {
    updateArrayData('taxDeductors', taxDeductors.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const totalTaxPaid = taxDeductors.reduce((sum, d) => sum + (Number(d.taxDeducted) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Taxes Deducted (Form 26AS/AIS)</h2>
          <p className="text-gray-400">Enter your detailed TDS, TCS, and Advance Tax transactions here.</p>
        </div>
        <button 
          onClick={handleAddRow}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Add Tax Record
        </button>
      </div>

      <div className="space-y-6 mb-8">
        {taxDeductors.length === 0 ? (
          <div className="bg-[#1a1a1a] p-12 rounded-xl border border-gray-800 text-center">
            <p className="text-gray-500 mb-4">No tax records added yet. Please add your TDS/TCS entries to claim credit.</p>
            <button 
              onClick={handleAddRow}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
            >
              Add First Record
            </button>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#242424] border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Tax Type</th>
                    <th className="p-4">Deductor Name</th>
                    <th className="p-4">TAN / PAN</th>
                    <th className="p-4">Gross Amount</th>
                    <th className="p-4">Tax Deducted</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {taxDeductors.map((row) => (
                    <tr key={row.id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="p-4 align-top">
                        <select
                          className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={row.type}
                          onChange={(e) => handleChange(row.id, 'type', e.target.value)}
                        >
                          <option value="TDS on Salary">TDS on Salary</option>
                          <option value="TDS on Other Income">TDS on Other Income</option>
                          <option value="TCS">TCS</option>
                          <option value="Advance Tax">Advance Tax</option>
                          <option value="Self Assessment Tax">Self Assessment Tax</option>
                        </select>
                        <select
                          className="w-full mt-2 bg-[#121212] border border-gray-700 rounded text-sm text-gray-400 p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={row.headOfIncome}
                          onChange={(e) => handleChange(row.id, 'headOfIncome', e.target.value)}
                        >
                          <option value="Salary">Salary</option>
                          <option value="Business">Business</option>
                          <option value="Capital Gains">Capital Gains</option>
                          <option value="Other Sources">Other Sources</option>
                        </select>
                      </td>
                      <td className="p-4 align-top">
                        <input
                          type="text"
                          placeholder="Name of Deductor"
                          className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={row.deductorName}
                          onChange={(e) => handleChange(row.id, 'deductorName', e.target.value)}
                        />
                      </td>
                      <td className="p-4 align-top">
                        <input
                          type="text"
                          placeholder="TAN / PAN"
                          className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                          value={row.tan}
                          onChange={(e) => handleChange(row.id, 'tan', e.target.value)}
                        />
                      </td>
                      <td className="p-4 align-top">
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-white p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={row.grossAmount || ''}
                          onChange={(e) => handleChange(row.id, 'grossAmount', Number(e.target.value))}
                        />
                      </td>
                      <td className="p-4 align-top">
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full bg-[#121212] border border-gray-700 rounded text-sm text-green-400 font-medium p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={row.taxDeducted || ''}
                          onChange={(e) => handleChange(row.id, 'taxDeducted', Number(e.target.value))}
                        />
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
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-[#242424] p-4 flex justify-between items-center border-t border-gray-800">
              <span className="text-gray-400 font-medium">Total Tax Claimed</span>
              <span className="text-xl font-bold text-green-400">₹{totalTaxPaid.toLocaleString('en-IN')}</span>
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
            onClick={() => navigate('/taxation/adjustments')}
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
