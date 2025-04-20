import React, { useState, useEffect } from 'react';

// Updated rates from Google Sheet (static for calculator)
const GOLD_RATE_PER_GRAM_24K = 8977; // From cell A2
const SILVER_RATE_PER_GRAM_PURE = 92;  // From cell B2
const LOAN_TO_VALUE = 0.75; // 75% LTV

// Purity factors relative to pure metal
const GOLD_PURITY_FACTORS = {
  '24K': 1,
  '22K': 22 / 24,
  '18K': 18 / 24,
};

const SILVER_PURITY_FACTORS = {
  '999': 1,       // Pure Silver
  '925': 0.925,   // Sterling Silver
};

const LoanCalculator = () => {
  const [metalType, setMetalType] = useState('gold');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState(metalType === 'gold' ? '22K' : '925');
  const [loanAmount, setLoanAmount] = useState(0);
  const [currentRate, setCurrentRate] = useState(GOLD_RATE_PER_GRAM_24K); // Base rate display

  // Update purity options and default when metal type changes
  useEffect(() => {
    if (metalType === 'gold') {
      setPurity('22K');
      setCurrentRate(GOLD_RATE_PER_GRAM_24K);
    } else {
      setPurity('925');
      setCurrentRate(SILVER_RATE_PER_GRAM_PURE);
    }
    setWeight(''); // Reset weight on metal change
    setLoanAmount(0); // Reset loan amount
  }, [metalType]);

  // Calculation logic
  useEffect(() => {
    const numericWeight = parseFloat(weight);
    if (!numericWeight || numericWeight <= 0) {
      setLoanAmount(0);
      return;
    }

    let baseRate = 0;
    let purityFactor = 0;

    if (metalType === 'gold') {
      baseRate = GOLD_RATE_PER_GRAM_24K;
      purityFactor = GOLD_PURITY_FACTORS[purity] || 0;
    } else {
      baseRate = SILVER_RATE_PER_GRAM_PURE;
      purityFactor = SILVER_PURITY_FACTORS[purity] || 0;
    }
    
    const valuePerGram = baseRate * purityFactor;
    const totalValue = numericWeight * valuePerGram;
    const calculatedLoan = totalValue * LOAN_TO_VALUE;
    
    setLoanAmount(calculatedLoan);

  }, [metalType, weight, purity]);
  
   const purityOptions = metalType === 'gold' ? Object.keys(GOLD_PURITY_FACTORS) : Object.keys(SILVER_PURITY_FACTORS);

  return (
    <section id="calculator" className="py-20 md:py-28 bg-white">
      <div className="premium-container grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        
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

        {/* Right Column: Updated Illustration */}
        <div className="hidden md:flex justify-center items-center animate-fade-in p-8">
           <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs h-auto text-gray-400">
              {/* Base */}
              <rect x="30" y="85" width="40" height="5" rx="1" className="fill-current text-gray-400"/>
              {/* Pillar */}
              <rect x="48" y="20" width="4" height="65" className="fill-current text-gray-500"/>
              {/* Beam - slightly tilted */}
              <rect x="10" y="18" width="80" height="4" rx="1" className="fill-current text-gray-500" transform="rotate(-2 50 20)"/>
              {/* Left Pan Hanger */}
              <path d="M 20 21 V 29 Q 20 34 25 34 H 35 Q 40 34 40 29 V 21" className="stroke-current text-gray-400" fill="none" strokeWidth="2" transform="rotate(-2 30 38)"/>
              {/* Right Pan Hanger */}
              <path d="M 60 21 V 29 Q 60 34 65 34 H 75 Q 80 34 80 29 V 21" className="stroke-current text-gray-400" fill="none" strokeWidth="2" transform="rotate(-2 70 38)"/>
              {/* Left Pan */}
              <ellipse cx="30" cy="38" rx="15" ry="4" className="fill-current text-aarthikaBlue/30" transform="rotate(-2 30 38)"/>
              {/* Right Pan */}
              <ellipse cx="70" cy="38" rx="15" ry="4" className="fill-current text-aarthikaDark/30" transform="rotate(-2 70 38)"/>
              
              {/* Gold & Silver on Left Pan */}
              <g transform="translate(22 28) rotate(-2 8 4)">
                {/* Gold Bars */}
                <rect x="0" y="0" width="8" height="5" rx="1" className="fill-current text-yellow-400"/>
                <rect x="1" y="6" width="8" height="5" rx="1" className="fill-current text-yellow-400 opacity-80"/>
                {/* Silver Coin */}
                <circle cx="13" cy="5" r="4" className="fill-current text-gray-300"/>
              </g>

              {/* 500 Rupee Note Bundle on Right Pan */}
              <g transform="translate(62 27) rotate(-2 8 5)">
                {/* Base color for notes */}
                <defs>
                  <linearGradient id="noteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: '#A0AEC0', stopOpacity: 1}} /> {/* Grayish */} 
                    <stop offset="100%" style={{stopColor: '#CBD5E0', stopOpacity: 1}} /> {/* Lighter Gray */} 
                  </linearGradient>
                </defs>
                {/* Stack of notes */}
                <rect x="0" y="4" width="16" height="6" rx="1" className="fill-[url(#noteGrad)]" />
                <rect x="1" y="2" width="16" height="6" rx="1" className="fill-[url(#noteGrad)] opacity-90" />
                <rect x="2" y="0" width="16" height="6" rx="1" className="fill-[url(#noteGrad)] opacity-80"/>
                {/* Band */}
                <rect x="7" y="-1" width="4" height="8" rx="0.5" className="fill-current text-gray-600 opacity-70" transform="rotate(15 9 3)"/>
              </g>
            </svg>
        </div>
      </div>
    </section>
  );
};

export default LoanCalculator; 