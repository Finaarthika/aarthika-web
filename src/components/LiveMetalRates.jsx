import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants ---
const FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes (for base rate refresh)
const SIMULATION_INTERVAL_MS = 750; // 3/4 second for fluctuation simulation
const MAX_FLUCTUATION_PERCENT = 0.85; // Max deviation from base rate (+/- %)
const TICK_FLUCTUATION_PERCENT = 0.15; // Max random change per tick (+/- %), adjust for smoothness

// --- Helper Functions ---
const getRandomMultiplier = () => {
  const percentChange = (Math.random() * 2 - 1) * TICK_FLUCTUATION_PERCENT / 100;
  return 1 + percentChange;
};

const formatRate = (rate) => {
  if (typeof rate !== 'number' || isNaN(rate)) return 'N/A';
  return rate.toFixed(2);
};

const LiveMetalRates = () => {
  const [baseRates, setBaseRates] = useState({ goldRate: null, silverRate: null });
  const [displayRates, setDisplayRates] = useState({ goldRate: null, silverRate: null });
  const [rateDirections, setRateDirections] = useState({ gold: 'same', silver: 'same' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevDisplayRatesRef = useRef(displayRates);

  // --- Fetching Logic ---
  const fetchBaseRates = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    setError(null);
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
        goldRate: current.goldRate === null || newBaseRates.goldRate !== baseRates.goldRate ? newBaseRates.goldRate : current.goldRate,
        silverRate: current.silverRate === null || newBaseRates.silverRate !== baseRates.silverRate ? newBaseRates.silverRate : current.silverRate,
      }));
      prevDisplayRatesRef.current = newBaseRates;
      setRateDirections({ gold: 'same', silver: 'same' });

    } catch (e) {
      console.error("Error fetching base metal rates:", e);
      setError(e.message || "Failed to load rates.");
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [baseRates.goldRate, baseRates.silverRate]); // Re-run if base rates change

  // Initial fetch and interval for base rates
  useEffect(() => {
    fetchBaseRates(true);
    const fetchInterval = setInterval(() => fetchBaseRates(false), FETCH_INTERVAL_MS);
    return () => clearInterval(fetchInterval);
  }, [fetchBaseRates]);

  // --- Simulation Logic ---
  useEffect(() => {
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
  }, [baseRates, rateDirections]); // Re-run if base rates change

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
            ₹{displayValue} {/* Rupee symbol */}
            <span className="text-lg ml-1">{arrow}</span>
          </p>
        )}
        <p className="text-xs opacity-80 mt-2">Per gram (24k)</p>
      </div>
    );
  };

  // --- Render Logic ---
  return (
    <section id="live-rates" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="premium-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3">Live Metal Rates</h2>
          {error && <p className="text-sm text-red-600 font-medium mt-2">Error fetching rates: {error}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
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