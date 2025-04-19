import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants ---
const FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const SIMULATION_INTERVAL_MS = 1500; // 1.5 seconds for smoother visual updates
const MAX_FLUCTUATION_PERCENT = 1.5; // Max deviation from base rate (+/- %)
const TICK_FLUCTUATION_PERCENT = 0.3; // Max random change per tick (+/- %)

// --- Helper Functions ---
// Function to generate a random fluctuation multiplier
const getRandomMultiplier = () => {
  const percentChange = (Math.random() * 2 - 1) * TICK_FLUCTUATION_PERCENT / 100; // Random +/- TICK_FLUCTUATION_PERCENT
  return 1 + percentChange;
};

// Function to format rate display
const formatRate = (rate) => {
  if (typeof rate !== 'number' || isNaN(rate)) return 'N/A';
  return rate.toFixed(2); // Format to 2 decimal places
};

const LiveMetalRates = () => {
  const [baseRates, setBaseRates] = useState({ goldRate: null, silverRate: null });
  const [displayRates, setDisplayRates] = useState({ goldRate: null, silverRate: null });
  const [rateDirections, setRateDirections] = useState({ gold: 'same', silver: 'same' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs to store previous values for comparison
  const prevDisplayRatesRef = useRef(displayRates);

  // --- Fetching Logic ---
  const fetchBaseRates = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    console.log("Fetching base metal rates...");
    try {
      const response = await fetch('/api/metal-rates');
      const data = await response.json(); // Attempt to parse JSON regardless of response.ok for error message

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      if (data.error) {
        // Handle errors reported within the JSON payload
        throw new Error(data.error);
      }

      // Convert fetched rates to numbers, default to null if invalid
      const fetchedGoldRate = parseFloat(data.goldRate);
      const fetchedSilverRate = parseFloat(data.silverRate);
      const newBaseRates = {
          goldRate: !isNaN(fetchedGoldRate) ? fetchedGoldRate : null,
          silverRate: !isNaN(fetchedSilverRate) ? fetchedSilverRate : null,
      };

      console.log("Base rates fetched:", newBaseRates);
      setBaseRates(newBaseRates);

      // IMPORTANT: Reset display rates to the newly fetched base rates
      setDisplayRates(newBaseRates); 
      prevDisplayRatesRef.current = newBaseRates; // Reset previous rates ref as well
      setRateDirections({ gold: 'same', silver: 'same' }); // Reset directions

    } catch (e) {
      console.error("Error fetching base metal rates:", e);
      setError(e.message || "Failed to load rates.");
      // Keep existing display rates if fetch fails? Or show error?
      // setDisplayRates({ goldRate: null, silverRate: null }); // Option: Clear display on fetch error
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch and interval for refetching base rates
  useEffect(() => {
    fetchBaseRates(true); // Initial fetch
    const fetchInterval = setInterval(() => fetchBaseRates(false), FETCH_INTERVAL_MS);
    return () => clearInterval(fetchInterval); // Cleanup interval
  }, [fetchBaseRates]);

  // --- Simulation Logic ---
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      // Only simulate if we have valid base rates
      if (baseRates.goldRate === null && baseRates.silverRate === null) return;

      setDisplayRates(currentDisplayRates => {
          const newDisplay = { ...currentDisplayRates };
          const newDirections = { ...rateDirections };
          const prevRates = prevDisplayRatesRef.current;

          // Simulate Gold
          if (baseRates.goldRate !== null && currentDisplayRates.goldRate !== null) {
              const multiplier = getRandomMultiplier();
              let newRate = currentDisplayRates.goldRate * multiplier;
              // Clamp to MAX_FLUCTUATION_PERCENT around base rate
              const maxDev = baseRates.goldRate * MAX_FLUCTUATION_PERCENT / 100;
              newRate = Math.max(baseRates.goldRate - maxDev, Math.min(baseRates.goldRate + maxDev, newRate));
              newDisplay.goldRate = newRate;
              newDirections.gold = newRate > prevRates.goldRate ? 'up' : (newRate < prevRates.goldRate ? 'down' : 'same');
          }

          // Simulate Silver
          if (baseRates.silverRate !== null && currentDisplayRates.silverRate !== null) {
              const multiplier = getRandomMultiplier();
              let newRate = currentDisplayRates.silverRate * multiplier;
              const maxDev = baseRates.silverRate * MAX_FLUCTUATION_PERCENT / 100;
              newRate = Math.max(baseRates.silverRate - maxDev, Math.min(baseRates.silverRate + maxDev, newRate));
              newDisplay.silverRate = newRate;
              newDirections.silver = newRate > prevRates.silverRate ? 'up' : (newRate < prevRates.silverRate ? 'down' : 'same');
          }
          
          // Update refs and state
          prevDisplayRatesRef.current = newDisplay; // Store current for next comparison
          setRateDirections(newDirections);
          return newDisplay;
      });

    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(simulationInterval); // Cleanup simulation interval
  }, [baseRates]); // Rerun simulation setup if base rates change

  // --- RateCard Component ---
  const RateCard = ({ metal, rate, direction, bgColor, icon }) => {
    const displayValue = formatRate(rate);
    const colorClass = direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-white';
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '';

    return (
      <div className={`relative overflow-hidden rounded-xl p-6 shadow-lg ${bgColor} text-white transform hover:scale-105 transition-transform duration-300 ease-in-out`}>
        <div className="absolute -top-4 -right-4 text-white/10 text-6xl">
          <i className={`fas ${icon}`}></i>
        </div>
        <h3 className="text-lg font-semibold mb-1 capitalize">{metal} Rate</h3>
        {loading ? (
          <div className="h-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          </div>
        ) : (
          <p className={`text-3xl md:text-4xl font-bold truncate transition-colors duration-300 ${colorClass}`} title={String(rate)}> 
            {displayValue}
            <span className="text-lg ml-1">{arrow}</span>
          </p>
        )}
        <p className="text-xs opacity-80 mt-2">Per gram (24k)</p>
      </div>
    );
  };

  // --- Render Logic ---
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="premium-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">Live Metal Rates</h2>
          <p className="text-sm text-gray-500">
            {error ? 
              <span className="text-red-600 font-medium">Error: {error}</span> : 
              "Rates based on public sheet data, updated every 15 mins. Fluctuation is simulated."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
          <RateCard
            metal="Gold"
            rate={displayRates.goldRate}
            direction={rateDirections.gold}
            bgColor="bg-gradient-to-br from-yellow-400 to-amber-600"
            icon="fa-coins"
          />
          <RateCard
            metal="Silver"
            rate={displayRates.silverRate}
            direction={rateDirections.silver}
            bgColor="bg-gradient-to-br from-gray-400 to-gray-600"
            icon="fa-ring"
          />
        </div>
      </div>
    </section>
  );
};

export default LiveMetalRates; 