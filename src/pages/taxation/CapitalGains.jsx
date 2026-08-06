import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const TaxInput = ({ label, value, onChange, placeholder, prefix, note, required, uppercase, type = "text", name }) => {
  const [localValue, setLocalValue] = React.useState(value === 0 || value === null || value === undefined ? '' : value);
  React.useEffect(() => {
    if (Number.isNaN(value) || typeof value === 'object') return;
    if (String(value) !== String(localValue) && value !== Number(localValue)) {
      setLocalValue(value === 0 || value === null || value === undefined ? '' : value);
    }
  }, [value]);
  const handleChange = (e) => {
    let val = e.target.value;
    if (uppercase) val = val.toUpperCase();
    if (prefix === '₹') {
       val = val.replace(/[^0-9.]/g, '');
       if ((val.match(/\./g) || []).length > 1) return;
    }
    setLocalValue(val);
    if (onChange) {
       e.target.value = val;
       if (name) e.target.name = name;
       onChange(e);
    }
  };
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2 text-gray-500 text-[14px]">{prefix}</span>}
        <input
          type={type}
          inputMode={prefix === '₹' ? 'numeric' : 'text'}
          name={name}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder || ''}
          className={`w-full border border-gray-300 rounded-md py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 ${prefix ? 'pl-7 pr-3' : 'px-3'} ${uppercase ? 'uppercase' : ''}`}
        />
      </div>
      {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
    </div>
  );
};


export default function CapitalGains() {
  const { taxData, updateNestedTaxData } = useTaxation();
  const navigate = useNavigate();
  const { capitalGains } = taxData;
  const [expandedSection, setExpandedSection] = React.useState(null);

  const handleCapitalChange = (type, q, val) => {
    updateNestedTaxData('capitalGains', type, q, val === '' ? '' : Number(val));
  };

  const totalStcg = Object.values(capitalGains.stcg).reduce((a,b) => Number(a) + Number(b), 0);
  const totalLtcg = Object.values(capitalGains.ltcg).reduce((a,b) => Number(a) + Number(b), 0);

  const { cgTransactions } = taxData;
  const [showManualForm, setShowManualForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    type: 'Equity', buyDate: '', sellDate: '', buyValue: '', sellValue: '', expenses: ''
  });

  const handleSaveTransaction = () => {
    const newId = cgTransactions.length > 0 ? Math.max(...cgTransactions.map(t => t.id)) + 1 : 1;
    updateArrayData('cgTransactions', [
      ...cgTransactions,
      { 
        id: newId, 
        assetName: 'Added manually',
        type: formData.type, 
        buyDate: formData.buyDate, 
        sellDate: formData.sellDate,
        buyValue: Number(formData.buyValue) || 0,
        sellValue: Number(formData.sellValue) || 0,
        expenses: Number(formData.expenses) || 0
      }
    ]);
    setFormData({ type: 'Equity', buyDate: '', sellDate: '', buyValue: '', sellValue: '', expenses: '' });
  };

  const handleRemoveTransaction = (id) => {
    updateArrayData('cgTransactions', cgTransactions.filter(t => t.id !== id));
  };

  const AccordionItem = ({ id, title, subtitle, icon }) => {
    const isExpanded = expandedSection === id;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 bg-gray-50">
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-slate-800">{title}</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setExpandedSection(isExpanded ? null : id)}
            className="bg-[#1b7a43] hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-full text-[13px] flex items-center gap-1.5 transition-colors"
          >
            <span>{isExpanded ? '-' : '+'}</span> {isExpanded ? 'Close' : 'Add'}
          </button>
        </div>
        
        {isExpanded && id === 'equity' && (
          <div className="p-6 border-t border-gray-100 bg-slate-50/30">
            {/* The Old STCG/LTCG Inputs were hidden here. Now replacing with the precise UI from screenshot */}
            <div className="text-center text-gray-500 font-bold mb-4 flex items-center justify-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-[13px]">OR</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 relative shadow-sm mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Add Data Manually
                  </h4>
                  <p className="text-[12px] text-gray-500 mt-1">Manually add transaction details for the cases where, Tax P&L report not available, broker isn't listed or not-supported</p>
                </div>
                <button className="text-[12px] font-bold text-green-700 border border-green-600 rounded-full px-4 py-1 hover:bg-green-50">
                  Hide
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Select Asset Type <span className="text-red-500">*</span></label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  >
                    <option value="Equity">Equity</option>
                    <option value="Mutual Funds">Mutual Funds</option>
                  </select>
                </div>
                <TaxInput label="Date of Purchase" type="date" value={formData.buyDate} onChange={(e) => setFormData({...formData, buyDate: e.target.value})} required />
                <TaxInput label="Date of Sale" type="date" value={formData.sellDate} onChange={(e) => setFormData({...formData, sellDate: e.target.value})} required />
                <TaxInput label="Purchase price" value={formData.buyValue} onChange={(e) => setFormData({...formData, buyValue: e.target.value})} required prefix="₹" />
                <TaxInput label="Total Sale Value" value={formData.sellValue} onChange={(e) => setFormData({...formData, sellValue: e.target.value})} required prefix="₹" />
                <TaxInput label="Transfer Expenses" value={formData.expenses} onChange={(e) => setFormData({...formData, expenses: e.target.value})} prefix="₹" note="i" />
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleSaveTransaction}
                  className="bg-[#1b7a43] hover:bg-green-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                >
                  Save Details
                </button>
              </div>
            </div>

            {cgTransactions && cgTransactions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#f0f9f4] text-slate-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">S No.</th>
                      <th className="px-4 py-3">Asset Type</th>
                      <th className="px-4 py-3">Assets Description</th>
                      <th className="px-4 py-3">Purchase Value</th>
                      <th className="px-4 py-3">Sale Value</th>
                      <th className="px-4 py-3">Date of Purchase</th>
                      <th className="px-4 py-3">Date of Sale</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cgTransactions.map((tx, idx) => (
                      <tr key={tx.id} className="border-b border-gray-100 text-gray-600 font-medium">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">{tx.type}</td>
                        <td className="px-4 py-3">{tx.assetName}</td>
                        <td className="px-4 py-3">{tx.buyValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">{tx.sellValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">{tx.buyDate ? tx.buyDate.split('-').reverse().join('/') : ''}</td>
                        <td className="px-4 py-3">{tx.sellDate ? tx.sellDate.split('-').reverse().join('/') : ''}</td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-green-600 hover:text-green-800 mx-1">✎</button>
                          <button onClick={() => handleRemoveTransaction(tx.id)} className="text-red-500 hover:text-red-700 mx-1">🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-800 mb-1 uppercase tracking-wide">Enter Your Capital Gains/Losses Details</h1>
        <p className="text-[15px] text-gray-500 font-medium">Enter details of equity, debentures, property & other securities</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <AccordionItem 
          id="equity"
          title="Equity, Mutual Funds, Intraday, F&O, and More" 
          subtitle="Upload/Import your Tax P&L report or add the transactions manually"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
        />
        <AccordionItem 
          id="unlisted"
          title="Unlisted & STT Unpaid" 
          subtitle="For unlisted/STT unpaid shares you have to add the transactions manually"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
        />
        <AccordionItem 
          id="bonds"
          title="Income from Bonds and Debentures" 
          subtitle="Add details if you earned from bonds & debentures"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <AccordionItem 
          id="other"
          title="Income from Sale of Other Assets" 
          subtitle="Add details if you earned from selling any other assets"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <AccordionItem 
          id="property"
          title="Gains from Selling Land and Buildings" 
          subtitle="Add details if you earned from selling land & buildings"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <AccordionItem 
          id="vda"
          title="Income from Virtual Digital Assets (VDA)" 
          subtitle="Add details if you earned from virtual digital assets (Crypto, NFT, DeFi Token, Gaming Token, etc.)"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
      </div>

      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate('/taxation/basic-details-2')} className="px-6 py-2.5 rounded border border-green-700 text-green-700 font-semibold hover:bg-green-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex gap-4">
          <button className="bg-[#0f2e4c] hover:bg-slate-800 text-white font-semibold py-2.5 px-8 rounded transition-colors">
            GET CA ASSISTED
          </button>
          <button 
            onClick={() => navigate('/taxation/business')}
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
