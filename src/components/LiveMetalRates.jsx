import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaCoins, FaRing, FaTachometerAlt, FaBalanceScale, FaLock } from 'react-icons/fa';

// --- Constants ---
const FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes (for base rate refresh)
const SIMULATION_INTERVAL_MS = 750; // 3/4 second for fluctuation simulation
const MAX_FLUCTUATION_PERCENT = 0.85; // Max deviation from base rate (+/- %)
const TICK_FLUCTUATION_PERCENT = 0.15; // Max random change per tick (+/- %), adjust for smoothness
const SEED_INTERVAL_MS = 5000; // Seed changes every 5 seconds
const LOCAL_STORAGE_KEY = 'aarthika_metal_rates_cache'; // Key for localStorage

// --- Helper Functions ---
// Function to save rates to localStorage
const saveRatesToLocalStorage = (rates) => {
  try {
    const ratesWithTimestamp = {
      ...rates,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ratesWithTimestamp));
    console.log('Rates saved to localStorage:', ratesWithTimestamp);
  } catch (e) {
    console.error('Error saving rates to localStorage:', e);
  }
};

// Function to get rates from localStorage
const getRatesFromLocalStorage = () => {
  try {
    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!cachedData) return null;
    
    const parsedData = JSON.parse(cachedData);
    console.log('Retrieved rates from localStorage:', parsedData);
    return parsedData;
  } catch (e) {
    console.error('Error retrieving rates from localStorage:', e);
    return null;
  }
};

// --- Network Status Check Function ---
const checkNetworkStatus = () => {
  return navigator.onLine;
};

// --- Time Check Function ---
const isMarketOpen = () => {
  const now = new Date();
  // Get UTC time components
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate IST (UTC+5:30)
  let istHours = utcHours + 5;
  let istMinutes = utcMinutes + 30;
  let istDay = utcDay;

  // Adjust hours and day if minutes overflow
  if (istMinutes >= 60) {
    istHours += 1;
    istMinutes -= 60;
  }

  // Adjust hours and day if hours overflow
  if (istHours >= 24) {
    istDay = (istDay + 1) % 7;
    istHours -= 24;
  }

  // Market Hours: Monday 00:30 IST to Saturday 01:30 IST
  if (istDay === 0) return false; // Closed on Sunday
  if (istDay === 6) { // Saturday
    if (istHours > 1 || (istHours === 1 && istMinutes >= 30)) {
      return false; // Closed after Sat 1:30 AM
    }
  }
  if (istDay === 1) { // Monday
    if (istHours < 0 || (istHours === 0 && istMinutes < 30)) {
      // This condition should technically not be met due to UTC offset logic,
      // but kept for clarity. If UTC is late Sun, IST might be early Mon.
      // We need to check if it's before Mon 00:30
       const utcOffsetMinutes = 5 * 60 + 30;
       const istTotalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + utcOffsetMinutes;
       const dayStartMinutes = 0 * 60 + 30; // 00:30
       if ((istTotalMinutes % (24 * 60)) < dayStartMinutes) {
           return false; // Before Monday 00:30 IST
       }
    }
  }
  // Otherwise, it's between Mon 00:30 and Sat 01:30
  return true;
};

// --- Simple Seeded PRNG (LCG) ---
function createLcg(seed) {
  let state = seed;
  const a = 1664525;
  const c = 1013904223;
  const m = 2**32;
  return () => {
    state = (a * state + c) % m;
    return state / m; // Return a value between 0 and 1
  };
}

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
  const [marketCurrentlyOpen, setMarketCurrentlyOpen] = useState(isMarketOpen()); // State for market status
  const [isOffline, setIsOffline] = useState(!checkNetworkStatus()); // Track online/offline status
  const prevDisplayRatesRef = useRef(displayRates);
  const fetchIntervalRef = useRef(null); // Ref for fetch interval
  const simulationIntervalRef = useRef(null); // Ref for simulation interval
  const randomGeneratorRef = useRef(null); // Ref to store the PRNG function

  // --- State for Calculator ---
  const [metalType, setMetalType] = useState('gold');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState(DEFAULT_GOLD_PURITY); 
  const [loanAmount, setLoanAmount] = useState(0);
  // Note: currentRate calculation moved below state declarations

  // --- Fetching Logic ---
  const fetchBaseRates = useCallback(async (isInitialLoad = false) => {
    if (!isMarketOpen()) { // Don't fetch if market is closed
      if(isInitialLoad) setLoadingRates(false); // Ensure loading stops on initial load if market closed
      setMarketCurrentlyOpen(false);
      return;
    }
    setMarketCurrentlyOpen(true);
    if (isInitialLoad) setLoadingRates(true);
    setRatesError(null);
    console.log("Fetching base metal rates...");
    
    // Check if we're offline
    const isNetworkAvailable = checkNetworkStatus();
    if (!isNetworkAvailable) {
      setIsOffline(true);
      const cachedRates = getRatesFromLocalStorage();
      if (cachedRates) {
        console.log("Using cached rates due to offline status:", cachedRates);
        const newBaseRates = {
          goldRate: parseFloat(cachedRates.goldRate),
          silverRate: parseFloat(cachedRates.silverRate)
        };
        
        if (!isNaN(newBaseRates.goldRate) && !isNaN(newBaseRates.silverRate)) {
          setBaseRates(newBaseRates);
          // Directly set displayRates from cached base rates when offline on initial load
          setDisplayRates({
            goldRate: newBaseRates.goldRate,
            silverRate: newBaseRates.silverRate,
          });
          if (isInitialLoad) {
            prevDisplayRatesRef.current = newBaseRates;
          }
          setRateDirections({ gold: 'same', silver: 'same' });
          if (isInitialLoad) setLoadingRates(false);
          return;
        }
      }
      
      // If no valid cached data available
      console.error("No cached rates available while offline");
      setRatesError("Network unavailable. No cached rates found.");
      if (isInitialLoad) setLoadingRates(false);
      return;
    }

    // Reset offline status if we get here (network available)
    setIsOffline(false);
    
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
      
      // Save rates to localStorage for offline use
      if (newBaseRates.goldRate !== null && newBaseRates.silverRate !== null) {
        saveRatesToLocalStorage({
          goldRate: newBaseRates.goldRate.toString(),
          silverRate: newBaseRates.silverRate.toString()
        });
      }
      
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
      
      // Try to use cached data if fetch fails
      const cachedRates = getRatesFromLocalStorage();
      if (cachedRates) {
        console.log("Using cached rates due to fetch error:", cachedRates);
        const newBaseRates = {
          goldRate: parseFloat(cachedRates.goldRate),
          silverRate: parseFloat(cachedRates.silverRate)
        };
        
        if (!isNaN(newBaseRates.goldRate) && !isNaN(newBaseRates.silverRate)) {
          setBaseRates(newBaseRates);
          setDisplayRates(current => ({
            goldRate: current.goldRate === null || isInitialLoad ? newBaseRates.goldRate : current.goldRate,
            silverRate: current.silverRate === null || isInitialLoad ? newBaseRates.silverRate : current.silverRate,
          }));
          if (isInitialLoad) {
            prevDisplayRatesRef.current = newBaseRates;
          }
          setRateDirections({ gold: 'same', silver: 'same' });
          setRatesError("Network error. Using cached rates.");
          if (isInitialLoad) setLoadingRates(false);
          return;
        }
      }
      
      // If no valid cached data available
      setRatesError(e.message || "Failed to load rates.");
      setDisplayRates({ goldRate: null, silverRate: null });
    } finally {
      if (isInitialLoad) setLoadingRates(false);
    }
  }, []);

  // --- Network status event listeners ---
  useEffect(() => {
    // Add event listeners for online/offline status
    const handleOnline = () => {
      console.log("Network is now online");
      setIsOffline(false);
      fetchBaseRates(false); // Fetch fresh data when back online
    };
    
    const handleOffline = () => {
      console.log("Network is now offline");
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchBaseRates]);

  // --- Interval for fetching and market status check ---
  useEffect(() => {
    fetchBaseRates(true); // Initial fetch

    const checkMarketAndFetch = () => {
      const marketOpen = isMarketOpen();
      setMarketCurrentlyOpen(marketOpen);
      if (marketOpen) {
        fetchBaseRates(false); // Fetch only if market is open
      } else {
        // Optional: Could clear display rates or show last known
        setRateDirections({ gold: 'same', silver: 'same' }); // Reset directions
      }
    };

    // Clear previous interval if exists
    if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    // Set new interval
    fetchIntervalRef.current = setInterval(checkMarketAndFetch, FETCH_INTERVAL_MS);

    // Cleanup interval on unmount
    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    };
  }, [fetchBaseRates]);

  // --- Simulation Logic (Uses Seeded PRNG & Checks Offline Status) ---
  useEffect(() => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

    // Start simulation only if ONLINE, market is open and rates are loaded
    if (!isOffline && marketCurrentlyOpen && !loadingRates && (baseRates.goldRate !== null || baseRates.silverRate !== null)) {
      
      simulationIntervalRef.current = setInterval(() => {
        // Calculate seed based on current time interval
        const currentSeed = Math.floor(Date.now() / SEED_INTERVAL_MS);
        // Create or reuse PRNG with the current seed
        // Note: For perfect sync, we should ideally generate the *sequence* from the seed 
        // each time, but creating a new generator per tick is simpler here.
        const random = createLcg(currentSeed); 

        const getRandomFluctuation = () => {
           const percentChange = (random() * 2 - 1) * TICK_FLUCTUATION_PERCENT / 100;
           return 1 + percentChange;
        };

        setDisplayRates(currentDisplayRates => {
          const newDisplay = { ...currentDisplayRates };
          const newDirections = { ...rateDirections };
          const prevRates = prevDisplayRatesRef.current;

          // Simulate Gold
          if (baseRates.goldRate !== null && currentDisplayRates.goldRate !== null) {
            const multiplier = getRandomFluctuation(); // Use seeded random
            let newRate = currentDisplayRates.goldRate * multiplier;
            const maxDev = baseRates.goldRate * MAX_FLUCTUATION_PERCENT / 100;
            newRate = Math.max(baseRates.goldRate - maxDev, Math.min(baseRates.goldRate + maxDev, newRate));
            newDisplay.goldRate = newRate;
            newDirections.gold = newRate > (prevRates.goldRate ?? -Infinity) ? 'up' : (newRate < (prevRates.goldRate ?? Infinity) ? 'down' : 'same');
          }

          // Simulate Silver
          if (baseRates.silverRate !== null && currentDisplayRates.silverRate !== null) {
            const multiplier = getRandomFluctuation(); // Use seeded random
            let newRate = currentDisplayRates.silverRate * multiplier;
            const maxDev = baseRates.silverRate * MAX_FLUCTUATION_PERCENT / 100;
            newRate = Math.max(baseRates.silverRate - maxDev, Math.min(baseRates.silverRate + maxDev, newRate));
            newDisplay.silverRate = newRate;
            newDirections.silver = newRate > (prevRates.silverRate ?? -Infinity) ? 'up' : (newRate < (prevRates.silverRate ?? Infinity) ? 'down' : 'same');
          }

          prevDisplayRatesRef.current = newDisplay;
          setRateDirections(newDirections);
          return newDisplay;
        });
      }, SIMULATION_INTERVAL_MS);
    } else {
      // If OFFLINE, market closed or loading, ensure simulation stops
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      // Reset directions when market closes OR we go offline
      if (!marketCurrentlyOpen || isOffline) {
         setRateDirections({ gold: 'same', silver: 'same' });
      }
    }

    // Cleanup interval on unmount or dependency change
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  // Add isOffline to dependency array
  }, [isOffline, marketCurrentlyOpen, loadingRates, baseRates, rateDirections]);

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
    const arrow = marketCurrentlyOpen && direction !== 'same' ? (direction === 'up' ? '↑' : '↓') : '';
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
          ) : ratesError ? (
             <p className={`text-2xl font-bold truncate text-yellow-300 leading-tight`}>
               Error
             </p>
          ) : rate === null ? (
             <p className={`text-2xl font-bold truncate text-gray-300 leading-tight`}>
               N/A
             </p>
          ) : (
            <p className={`text-3xl md:text-4xl font-bold truncate transition-colors duration-300 ${colorClass} leading-tight`} title={String(rate)}>
              ₹{displayValue} 
              <span className="text-lg ml-1">{arrow}</span>
            </p>
          )}
          <p className="text-xs opacity-80 mt-1">
            {perGramText} 
            {!marketCurrentlyOpen && rate !== null && <span className="ml-1 font-medium text-yellow-300">(Market Closed)</span>}
            {isOffline && rate !== null && <span className="ml-1 font-medium text-yellow-300">(Offline Mode)</span>}
           </p> 
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
          {ratesError && !loadingRates && <p className="text-sm text-red-600 font-medium mt-4">Error loading rates: {ratesError}</p>}
          {!marketCurrentlyOpen && !loadingRates && !ratesError && (baseRates.goldRate !== null || baseRates.silverRate !== null) && (
               <p className="text-sm text-yellow-600 font-medium mt-4 bg-yellow-100 px-3 py-1 rounded inline-block">Market Closed</p>
           )}
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
                   perGramText="Per gram (24k Pure)"
                 />
                 <RateCard
                   metal="Silver"
                   rate={displayRates.silverRate}
                   direction={rateDirections.silver}
                   icon={<FaRing/>}
                   perGramText="Per gram (999 Pure)"
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