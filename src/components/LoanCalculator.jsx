import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaLock, FaBalanceScale } from 'react-icons/fa'; // Import icons

const GOLD_PURITY_FACTORS = {
  '24K': 1,
  '22K': 0.916667,
  '20K': 0.833333,
  '18K': 0.75,
  '14K': 0.583333,
  '10K': 0.416667,
};

const SILVER_PURITY_FACTORS = {
  '999': 0.999,
  '995': 0.995,
  '925': 0.925,
};

const LOAN_TO_VALUE = 0.75;

const LoanCalculator = () => {
  const [metalType, setMetalType] = useState('gold');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState('24K');
  const [loanAmount, setLoanAmount] = useState(0);
  const [currentRate, setCurrentRate] = useState(0);

  useEffect(() => {
    // Fetch current rate based on metalType
    // Set currentRate state
  }, [metalType]);

  useEffect(() => {
    // Calculate loan amount based on weight, purity, and currentRate
    // Set loanAmount state
  }, [weight, purity, currentRate]);

  const purityOptions = metalType === 'gold' ? Object.keys(GOLD_PURITY_FACTORS) : Object.keys(SILVER_PURITY_FACTORS);

  return (
    <section id="calculator" className="py-20 md:py-28 bg-white">
      <div className="premium-container max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-start"> 
        
        {/* Left Column: Inputs & Output */}
        <div className="animate-fade-in-delay">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">Loan Calculator</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mb-8"></div>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            Estimate the loan amount you can get against your gold or silver. 
            <br className="hidden md:block"/>Final valuation happens at our branch.
          </p>

          <div className="space-y-6">
            {/* Metal Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metal Type</label>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setMetalType('gold')} 
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${metalType === 'gold' ? 'bg-aarthikaBlue text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Gold
                </button>
                <button 
                  onClick={() => setMetalType('silver')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${metalType === 'silver' ? 'bg-aarthikaBlue text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Silver
                </button>
              </div>
            </div>

            {/* Weight Input */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 10"
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-aarthikaBlue focus:ring-1 focus:ring-aarthikaBlue outline-none transition duration-150 ease-in-out"
              />
            </div>

            {/* Purity Selection */}
            <div>
              <label htmlFor="purity" className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
              <select
                id="purity"
                name="purity"
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:border-aarthikaBlue focus:ring-1 focus:ring-aarthikaBlue outline-none transition duration-150 ease-in-out appearance-none"
              >
                {purityOptions.map(option => (
                  <option key={option} value={option}>
                    {metalType === 'gold' ? `${option}` : `${option} (${(SILVER_PURITY_FACTORS[option]*100).toFixed(1)}% Pure)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Loan Amount */}
            <div className="bg-gradient-to-r from-aarthikaDark/5 to-aarthikaBlue/5 border border-aarthikaBlue/20 p-6 rounded-lg mt-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Estimated Loan Amount (at {LOAN_TO_VALUE * 100}% LTV)</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-aarthikaDark to-aarthikaBlue">
                ₹{loanAmount > 0 ? loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                 Based on indicative rate of ₹{currentRate.toLocaleString('en-IN')}/gm for pure {metalType}. Market rates fluctuate.
                </p>
            </div>
          </div>
        </div>

        {/* Right Column: Informative Content */}
        <div className="hidden md:block animate-fade-in-delay bg-gradient-to-br from-aarthikaBlue/5 to-transparent p-8 lg:p-12 rounded-lg border border-aarthikaBlue/10 mt-4 lg:mt-0 self-stretch">
          <h3 className="text-2xl font-semibold text-gray-800 mb-5">Transparent & Secure Loans</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            At Aarthika, we prioritize a clear and trustworthy loan process. We use certified methods for valuation and ensure your valuable assets are stored securely, providing peace of mind.
          </p>
          
          <div className="space-y-5">
            <div className="flex items-start">
              <FaTachometerAlt className="text-aarthikaBlue text-xl mr-4 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Quick Disbursal</h4>
                <p className="text-sm text-gray-500 leading-snug">Loan amounts often disbursed within minutes after approval and verification.</p>
              </div>
            </div>
             <div className="flex items-start">
              <FaBalanceScale className="text-aarthikaBlue text-xl mr-4 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Transparent Valuation</h4>
                <p className="text-sm text-gray-500 leading-snug">Accurate assessment using certified methods right in front of you.</p>
              </div>
            </div>
            <div className="flex items-start">
              <FaLock className="text-aarthikaBlue text-xl mr-4 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Secure Storage</h4>
                <p className="text-sm text-gray-500 leading-snug">Your pledged assets are kept safe in state-of-the-art secure vaults.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoanCalculator;
