import React from 'react';
import { useTaxation } from './TaxationContext';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
    <span className="text-gray-200 font-medium">{label}</span>
    <div className="flex bg-[#1a1a1a] rounded-full p-1 border border-gray-800">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          value ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          !value ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        No
      </button>
    </div>
  </div>
);

export default function Onboarding() {
  const { taxData, updateTaxData } = useTaxation();
  const navigate = useNavigate();

  const handleClientChange = (e) => {
    updateTaxData('clientDetails', e.target.name, e.target.value);
  };

  const handleIncomeChange = (key, value) => {
    updateTaxData('incomes', key, value);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Client Profile</h2>
        <p className="text-gray-400">Let's start by setting up the basic details and income sources for this client.</p>
      </div>

      <div className="space-y-8">
        {/* Client Details Section */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">PAN Number</label>
              <input
                type="text"
                name="pan"
                value={taxData.clientDetails.pan}
                onChange={handleClientChange}
                placeholder="ABCDE1234F"
                className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Assessment Year</label>
              <select
                name="assessmentYear"
                value={taxData.clientDetails.assessmentYear}
                onChange={handleClientChange}
                className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="2026-27">2026-27 (FY 2025-26)</option>
                <option value="2025-26">2025-26 (FY 2024-25)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={taxData.clientDetails.firstName}
                onChange={handleClientChange}
                placeholder="John"
                className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={taxData.clientDetails.lastName}
                onChange={handleClientChange}
                placeholder="Doe"
                className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Income Sources Section */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm">2</span>
            Income Sources
          </h3>
          <p className="text-sm text-gray-400 mb-6">Select all applicable income sources. This will customize the required forms in the sidebar.</p>
          
          <div className="space-y-4">
            <Toggle 
              label="Business/Profession (Presumptive 44AD)" 
              value={taxData.incomes.hasBusiness} 
              onChange={(val) => handleIncomeChange('hasBusiness', val)} 
            />
            <Toggle 
              label="Capital Gains/Losses (Shares, MFs)" 
              value={taxData.incomes.hasCapitalGains} 
              onChange={(val) => handleIncomeChange('hasCapitalGains', val)} 
            />
            <Toggle 
              label="Other Sources (Interest, Dividend, Gifts)" 
              value={taxData.incomes.hasOtherSources} 
              onChange={(val) => handleIncomeChange('hasOtherSources', val)} 
            />
            <Toggle 
              label="Exempt Income (Agriculture, PPF, etc.)" 
              value={taxData.incomes.hasExemptIncome} 
              onChange={(val) => handleIncomeChange('hasExemptIncome', val)} 
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => navigate('/taxation/business')}
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
