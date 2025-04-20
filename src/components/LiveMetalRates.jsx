import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaCoins, FaRing, FaTachometerAlt, FaBalanceScale, FaLock } from 'react-icons/fa';

// --- Constants ---
const FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes (for base rate refresh)
const SIMULATION_INTERVAL_MS = 750; // 3/4 second for fluctuation simulation
const MAX_FLUCTUATION_PERCENT = 0.85; // Max deviation from base rate (+/- %)
const TICK_FLUCTUATION_PERCENT = 0.15; // Max random change per tick (+/- %), adjust for smoothness

// --- Loan Calculator Constants (Defined INSIDE the component now) ---
// Moved consts like LOAN_TO_VALUE, GOLD_PURITY_FACTORS etc. inside component scope

// --- Helper Functions ---
const getRandomMultiplier = () => {
  const percentChange = (Math.random() * 2 - 1) * TICK_FLUCTUATION_PERCENT / 100;
  return 1 + percentChange;
};

const formatRate = (rate) => {
  if (typeof rate !== 'number' || isNaN(rate)) return 'N/A';
  // Changed formatting back to toFixed(2) as localeString was causing issues in display
  return rate.toFixed(2);
};

const LiveMetalRates = () => {

  // --- Loan Calculator Constants (Moved INSIDE component scope) ---
  const LOAN_TO_VALUE = 0.75; 
  const GOLD_PURITY_FACTORS = {
    '24K': 1,       
    '22K': 22 / 24, 
    '18K': 18 / 24, 
    '14K': 14 / 24, 
  };
  const SILVER_PURITY_FACTORS = {
    '999': 0.999, 
    '925': 0.925, 
    '85%': 0.85,
    '80%': 0.80,
    '75%': 0.75,
    '70%': 0.70,
    '65%': 0.65,
  };
  const DEFAULT_GOLD_PURITY = '18K';
  const DEFAULT_SILVER_PURITY = '70%';

  // --- State for Live Rates ---
  const [baseRates, setBaseRates] = useState({ goldRate: null, silverRate: null });
  const [displayRates, setDisplayRates] = useState({ goldRate: null, silverRate: null });
  const [rateDirections, setRateDirections] = useState({ gold: 'same', silver: 'same' });
  const [loadingRates, setLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState(null);
  const prevDisplayRatesRef = useRef(displayRates);

  // --- State for Calculator ---
  const [metalType, setMetalType] = useState('gold');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState(DEFAULT_GOLD_PURITY); 
  const [loanAmount, setLoanAmount] = useState(0);
  // Note: currentRate calculation moved below state declarations

  // --- Fetching Logic ---
  const fetchBaseRates = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoadingRates(true);
    setRatesError(null);
    console.log("Fetching base metal rates...");
    try {
      const response = await fetch('/api/metal-rates');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
      if (data.error) throw new Error(data.error);

      const fetchedGoldRate = parseFloat(data.goldRate);
      const fetchedSilverRate = parseFloat(data.silverRate);
      const newBaseRates = {
          goldRate: !isNaN(fetchedGoldRate) ? fetchedGoldRate : null,
          silverRate: !isNaN(fetchedSilverRate) ? fetchedSilverRate : null,
      };

      console.log("Base rates fetched:", newBaseRates);
      setBaseRates(newBaseRates);

      // Reset display rates if they are null or base rates change significantly (optional)
      setDisplayRates(current => ({
        goldRate: current.goldRate === null || isInitialLoad ? newBaseRates.goldRate : current.goldRate,
        silverRate: current.silverRate === null || isInitialLoad ? newBaseRates.silverRate : current.silverRate,
      }));
      if (isInitialLoad) {
          prevDisplayRatesRef.current = newBaseRates;
      }
      setRateDirections({ gold: 'same', silver: 'same' });

    } catch (e) {
      console.error("Error fetching base metal rates:", e);
      setRatesError(e.message || "Failed to load rates.");
      setDisplayRates({ goldRate: null, silverRate: null });
    } finally {
      if (isInitialLoad) setLoadingRates(false);
    }
  }, []);

  // Initial fetch and interval for base rates
  useEffect(() => {
    fetchBaseRates(true);
    const fetchInterval = setInterval(() => fetchBaseRates(false), FETCH_INTERVAL_MS);
    return () => clearInterval(fetchInterval);
  }, [fetchBaseRates]);

  // --- Simulation Logic ---
  useEffect(() => {
    if (loadingRates) return;
    const simulationInterval = setInterval(() => {
      if (baseRates.goldRate === null && baseRates.silverRate === null) return;

      setDisplayRates(currentDisplayRates => {
          const newDisplay = { ...currentDisplayRates };
          const newDirections = { ...rateDirections }; // Start with current directions
          const prevRates = prevDisplayRatesRef.current;

          // Simulate Gold
          if (baseRates.goldRate !== null && currentDisplayRates.goldRate !== null) {
              const multiplier = getRandomMultiplier();
              let newRate = currentDisplayRates.goldRate * multiplier;
              const maxDev = baseRates.goldRate * MAX_FLUCTUATION_PERCENT / 100;
              newRate = Math.max(baseRates.goldRate - maxDev, Math.min(baseRates.goldRate + maxDev, newRate));
              newDisplay.goldRate = newRate;
              // Compare with previous *display* rate to get tick direction
              newDirections.gold = newRate > (prevRates.goldRate ?? -Infinity) ? 'up' : (newRate < (prevRates.goldRate ?? Infinity) ? 'down' : 'same');
          }

          // Simulate Silver
          if (baseRates.silverRate !== null && currentDisplayRates.silverRate !== null) {
              const multiplier = getRandomMultiplier();
              let newRate = currentDisplayRates.silverRate * multiplier;
              const maxDev = baseRates.silverRate * MAX_FLUCTUATION_PERCENT / 100;
              newRate = Math.max(baseRates.silverRate - maxDev, Math.min(baseRates.silverRate + maxDev, newRate));
              newDisplay.silverRate = newRate;
              newDirections.silver = newRate > (prevRates.silverRate ?? -Infinity) ? 'up' : (newRate < (prevRates.silverRate ?? Infinity) ? 'down' : 'same');
          }

          prevDisplayRatesRef.current = newDisplay; // Update ref for next tick comparison
          setRateDirections(newDirections);
          return newDisplay;
      });

    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(simulationInterval);
  }, [baseRates, rateDirections, loadingRates]); // Re-run if base rates change

  useEffect(() => {
    if (metalType === 'gold') {
      setPurity(DEFAULT_GOLD_PURITY); 
    } else {
      setPurity(DEFAULT_SILVER_PURITY); 
    }
    setWeight(''); 
    setLoanAmount(0); 
  }, [metalType]); // Keep metalType dependency

  useEffect(() => {
    const numericWeight = parseFloat(weight);
    if (!numericWeight || numericWeight <= 0 || baseRates.goldRate === null || baseRates.silverRate === null) {
      setLoanAmount(0);
      return;
    }
    let baseRate = 0;
    let purityFactor = 0;
    if (metalType === 'gold') {
      baseRate = baseRates.goldRate;
      purityFactor = GOLD_PURITY_FACTORS[purity] || 0;
    } else {
      baseRate = baseRates.silverRate;
      purityFactor = SILVER_PURITY_FACTORS[purity] || 0;
    }
    const valuePerGram = baseRate * purityFactor;
    const totalValue = numericWeight * valuePerGram;
    const calculatedLoan = totalValue * LOAN_TO_VALUE;
    setLoanAmount(calculatedLoan);
  }, [metalType, weight, purity, baseRates, GOLD_PURITY_FACTORS, SILVER_PURITY_FACTORS, LOAN_TO_VALUE]); // Added constants to dependency array as they are now inside scope

  // --- Derived State (Moved inside component scope) ---
  const purityOptions = metalType === 'gold' 
    ? Object.keys(GOLD_PURITY_FACTORS) 
    : Object.keys(SILVER_PURITY_FACTORS);
  
  const currentCalcRate = metalType === 'gold' ? baseRates.goldRate : baseRates.silverRate;

  // --- RateCard Component (Styling adjusted slightly for consistency) ---
  const RateCard = ({ metal, rate, direction, icon, perGramText="Per gram (24k)" }) => {
    const displayValue = formatRate(rate);
    const colorClass = direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : 'text-white';
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '';
    const bgColor = metal === 'Gold' ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-gradient-to-br from-gray-400 to-gray-500';

    return (
      // Consistent height and padding
      <div className={`relative overflow-hidden rounded-xl p-6 shadow-md ${bgColor} text-white min-h-[150px] flex flex-col justify-between`}>
        <div>
          <div className="absolute -top-4 -right-4 text-white/10 text-6xl">
            {icon}
          </div>
          <h3 className="text-lg font-semibold mb-1 capitalize">{metal} Rate</h3>
        </div>
        <div>
          {loadingRates ? (
            <div className="h-10 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          ) : (
            <p className={`text-3xl md:text-4xl font-bold truncate transition-colors duration-300 ${colorClass} leading-tight`} title={String(rate)}>
              ₹{displayValue} 
              <span className="text-lg ml-1">{arrow}</span>
            </p>
          )}
          <p className="text-xs opacity-80 mt-1">{perGramText}</p> 
       </div>
      </div>
    );
  };

  // --- Render Logic (Revised Layout for Alignment) ---
  return (
    <section id="live-rates" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3">Live Rates & Loan Calculator</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-aarthikaDark to-aarthikaBlue rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 mx-auto">
              Check today's indicative rates and estimate your potential loan amount instantly.
          </p>
          {ratesError && <p className="text-sm text-red-600 font-medium mt-4">Error fetching rates: {ratesError}</p>}
        </div>

        {/* Main Content Grid - Applying consistent styling */}
        {/* Use items-stretch for equal height columns, adjust gap */} 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-stretch"> {/* Changed to items-stretch */} 
           
           {/* Column 1: Calculator - Wrapped in a styled div */} 
           <div className="animate-fade-in-delay bg-white p-8 lg:p-10 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
             <h3 className="text-2xl font-semibold text-gray-800 mb-6">Estimate Your Loan</h3>
             <div className="space-y-6 flex-grow flex flex-col">
                {/* ... Calculator form elements ... */} 
                 {/* Metal Type Selection */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Metal Type</label>
                   <div className="flex space-x-4">
                     <button 
                       onClick={() => setMetalType('gold')} 
                       className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${metalType === 'gold' ? 'bg-aarthikaBlue text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                     >
                       Gold
                     </button>
                     <button 
                       onClick={() => setMetalType('silver')}
                       className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${metalType === 'silver' ? 'bg-aarthikaBlue text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                     >
                       Silver
                     </button>
                   </div>
                 </div>
    
                 {/* Weight & Purity Inputs */}
                 <div className="grid sm:grid-cols-2 gap-6">
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
                             {metalType === 'gold' 
                               ? `${option}` 
                               : option.includes('%') 
                                   ? `${option}` 
                                   : `${option} (${(SILVER_PURITY_FACTORS[option]*100).toFixed(1)}% Pure)`}
                           </option>
                         ))}
                       </select>
                     </div>
                 </div>
    
                 {/* Estimated Loan Amount - Use flex-grow to push to bottom */} 
                 <div className="bg-gradient-to-r from-aarthikaDark/5 to-aarthikaBlue/5 border border-aarthikaBlue/20 p-6 rounded-lg mt-auto text-center">
                     <p className="text-sm text-gray-600 mb-1">Estimated Loan Amount (at {LOAN_TO_VALUE * 100}% LTV)</p>
                     <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-aarthikaDark to-aarthikaBlue">
                     ₹{loanAmount > 0 ? formatRate(loanAmount) : '0.00'}
                     </p>
                     <p className="text-xs text-gray-500 mt-3">
                     Based on indicative rate of ₹{formatRate(currentCalcRate)}/gm for pure {metalType}. Market rates fluctuate.
                     </p>
                 </div>
             </div> 
           </div>
           
           {/* Column 2: Rates & Info - Wrapped in a div to allow internal spacing */} 
           <div className="lg:col-span-1 space-y-8 flex flex-col h-full"> {/* Use flex flex-col */} 
              {/* Rate Cards take available space */} 
              <div className="space-y-8">
                 <RateCard
                   metal="Gold"
                   rate={displayRates.goldRate}
                   direction={rateDirections.gold}
                   icon={<FaCoins/>}
                   perGramText="Per gram (24k Approx.)"
                 />
                 <RateCard
                   metal="Silver"
                   rate={displayRates.silverRate}
                   direction={rateDirections.silver}
                   icon={<FaRing/>}
                   perGramText="Per gram (999 Approx.)"
                 />
              </div>
               {/* Info Block - Apply consistent styling, push to bottom if needed or allow natural flow */}
              <div className="animate-fade-in-delay bg-white p-6 lg:p-8 rounded-xl border border-gray-100 shadow-lg mt-auto"> {/* Use mt-auto to push down */} 
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Transparent & Secure</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  We use certified valuation methods and ensure secure storage for your assets.
                </p>
                <div className="space-y-4 text-sm">
                    <div className="flex items-center text-gray-600">
                       <FaTachometerAlt className="text-aarthikaBlue mr-3 flex-shrink-0 w-4" /> Quick Disbursal
                    </div>
                     <div className="flex items-center text-gray-600">
                       <FaBalanceScale className="text-aarthikaBlue mr-3 flex-shrink-0 w-4" /> Fair Valuation
                    </div>
                     <div className="flex items-center text-gray-600">
                       <FaLock className="text-aarthikaBlue mr-3 flex-shrink-0 w-4" /> Secure Storage
                    </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default LiveMetalRates;