import React from 'react';
import { useTaxation } from './TaxationContext';

export default function BankAccounts() {
  const { taxData, updateArrayData } = useTaxation();
  const bankAccounts = taxData.bankAccounts || [];

  const handleAddAccount = () => {
    const newId = bankAccounts.length > 0 ? Math.max(...bankAccounts.map(a => a.id)) + 1 : 1;
    const newArray = [...bankAccounts, { id: newId, bankName: '', ifsc: '', accountNumber: '', type: 'Savings', isRefund: bankAccounts.length === 0 }];
    updateArrayData('bankAccounts', newArray);
  };

  const handleRemoveAccount = (id) => {
    const newArray = bankAccounts.filter(a => a.id !== id);
    // Ensure at least one is selected for refund if array is not empty
    if (newArray.length > 0 && !newArray.some(a => a.isRefund)) {
      newArray[0].isRefund = true;
    }
    updateArrayData('bankAccounts', newArray);
  };

  const handleChange = (id, field, value) => {
    const newArray = bankAccounts.map(account => {
      if (account.id === id) {
        if (field === 'isRefund' && value === true) {
          return { ...account, [field]: value };
        }
        return { ...account, [field]: value };
      }
      // If setting a new refund account, uncheck others
      if (field === 'isRefund' && value === true) {
        return { ...account, isRefund: false };
      }
      return account;
    });
    updateArrayData('bankAccounts', newArray);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Bank Accounts</h2>
          <p className="text-sm text-slate-500 mt-1">Add all your active bank accounts. Select one for tax refunds.</p>
        </div>
        <button 
          onClick={handleAddAccount}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Bank Account
        </button>
      </div>

      <div className="p-6">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No bank accounts added yet. Click 'Add Bank Account' to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {bankAccounts.map((account, index) => (
              <div key={account.id} className="relative p-5 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => handleRemoveAccount(account.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
                
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Account #{index + 1}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. HDFC Bank"
                      value={account.bankName}
                      onChange={(e) => handleChange(account.id, 'bankName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase"
                      placeholder="e.g. HDFC0001234"
                      value={account.ifsc}
                      onChange={(e) => handleChange(account.id, 'ifsc', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Acct No"
                      value={account.accountNumber}
                      onChange={(e) => handleChange(account.id, 'accountNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Type</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                      value={account.type}
                      onChange={(e) => handleChange(account.id, 'type', e.target.value)}
                    >
                      <option value="Savings">Savings Account</option>
                      <option value="Current">Current Account</option>
                      <option value="NRO">NRO Account</option>
                      <option value="NRE">NRE Account</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="refundAccount"
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      checked={account.isRefund}
                      onChange={() => handleChange(account.id, 'isRefund', true)}
                    />
                    <span className="ml-2 text-sm text-slate-700 font-medium">Use this account for Income Tax Refund</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
