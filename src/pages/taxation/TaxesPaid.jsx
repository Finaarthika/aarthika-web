import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

export default function TaxesPaid() {
  const { taxData, updateArrayData } = useTaxation();
  const navigate = useNavigate();
  const taxDeductors = taxData.taxDeductors || [];

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
    <div className="max-w-5xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Taxes Deducted / Paid</h1>
        <p className="text-[15px] text-gray-500 font-medium">Verify your TDS, TCS, and Advance Tax transactions (Form 26AS/AIS)</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#1b7a43] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="font-bold text-lg text-slate-800">Tax Records</h3>
          </div>
          <button 
            onClick={handleAddRow}
            className="px-4 py-2 border border-[#1b7a43] text-[#1b7a43] text-sm font-semibold rounded hover:bg-green-50 transition-colors"
          >
            + Add Tax Record
          </button>
        </div>

        {taxDeductors.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50/50">
            <p className="text-slate-500 mb-4 font-medium">No tax records added yet. Please add your TDS/TCS entries to claim credit.</p>
            <button 
              onClick={handleAddRow}
              className="px-6 py-2.5 bg-[#1b7a43] text-white font-semibold rounded shadow-sm hover:bg-green-700 transition-colors"
            >
              Add First Record
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Tax Type & Head</th>
                    <th className="p-4">Deductor Name</th>
                    <th className="p-4">TAN / PAN</th>
                    <th className="p-4">Gross Amount</th>
                    <th className="p-4">Tax Deducted</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {taxDeductors.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 align-top w-1/4">
                        <select
                          className="w-full border border-gray-300 rounded-md text-[13px] text-slate-800 py-1.5 px-2 mb-2 focus:ring-1 focus:ring-green-600 outline-none bg-white"
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
                          className="w-full border border-gray-300 rounded-md text-[13px] text-slate-500 py-1.5 px-2 focus:ring-1 focus:ring-green-600 outline-none bg-gray-50"
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
                          className="w-full border border-gray-300 rounded-md text-[13px] text-slate-800 py-1.5 px-3 focus:ring-1 focus:ring-green-600 outline-none"
                          value={row.deductorName}
                          onChange={(e) => handleChange(row.id, 'deductorName', e.target.value)}
                        />
                      </td>
                      <td className="p-4 align-top w-32">
                        <input
                          type="text"
                          placeholder="TAN/PAN"
                          className="w-full border border-gray-300 rounded-md text-[13px] text-slate-800 py-1.5 px-3 uppercase focus:ring-1 focus:ring-green-600 outline-none"
                          value={row.tan}
                          onChange={(e) => handleChange(row.id, 'tan', e.target.value)}
                        />
                      </td>
                      <td className="p-4 align-top w-32">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-gray-500 text-[13px]">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full border border-gray-300 rounded-md text-[13px] text-slate-800 py-1.5 pl-6 pr-2 focus:ring-1 focus:ring-green-600 outline-none"
                            value={row.grossAmount || ''}
                            onChange={(e) => handleChange(row.id, 'grossAmount', Number(e.target.value))}
                          />
                        </div>
                      </td>
                      <td className="p-4 align-top w-32">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-green-600 font-bold text-[13px]">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full border border-green-300 rounded-md text-[13px] text-green-700 font-semibold py-1.5 pl-6 pr-2 focus:ring-1 focus:ring-green-600 outline-none bg-green-50/30"
                            value={row.taxDeducted || ''}
                            onChange={(e) => handleChange(row.id, 'taxDeducted', Number(e.target.value))}
                          />
                        </div>
                      </td>
                      <td className="p-4 align-top text-center">
                        <button 
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove Row"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-5 flex justify-between items-center border-t border-gray-200">
              <span className="text-gray-600 font-bold text-[14px]">Total Tax Claimed</span>
              <span className="text-xl font-bold text-green-700">₹{totalTaxPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => {
            if (taxData.incomes.hasDeductions) navigate('/taxation/deductions');
            else if (taxData.incomes.hasExemptIncome) navigate('/taxation/exempt-income');
            else if (taxData.incomes.hasOtherSources) navigate('/taxation/other-sources');
            else if (taxData.incomes.hasCapitalGains) navigate('/taxation/capital-gains');
            else if (taxData.incomes.hasBusiness) navigate('/taxation/business');
            else navigate('/taxation/bank-accounts');
          }}
          className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => navigate('/taxation/adjustments')}
            className="bg-[#1b7a43] hover:bg-green-700 text-white font-semibold py-2.5 px-8 rounded flex items-center gap-2 transition-colors"
          >
            CONTINUE
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
