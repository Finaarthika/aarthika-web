import React, { useState, useEffect } from 'react';

const LiveMetalRates = () => {
  const [rates, setRates] = useState({ goldRate: null, silverRate: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use relative path for the API endpoint
        const response = await fetch('/api/metal-rates');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRates(data);
        // Check if the API returned an error message within the data
        if (data.error) {
             setError(data.error);
        }
      } catch (e) {
        console.error("Error fetching metal rates:", e);
        setError(e.message || "Failed to load rates. Please try again later.");
        // Keep potentially stale data if fetch fails
        // setRates({ goldRate: 'Error', silverRate: 'Error' }); 
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Note: No need for setInterval here as the caching is handled server-side
    // The component will fetch fresh data (or cached data from server) on mount/refresh.

  }, []); // Empty dependency array means this runs once on mount

  const RateCard = ({ metal, rate, bgColor, icon }) => (
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
        <p className="text-3xl md:text-4xl font-bold truncate" title={rate}>{rate}</p>
      )}
      <p className="text-xs opacity-80 mt-2">Per gram (24k)</p> {/* Example unit */} 
    </div>
  );

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="premium-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">Live Metal Rates</h2>
          <p className="text-sm text-gray-500">
             { error ? <span className="text-red-600 font-medium">{error}</span> : "Updated Live from Aarthika Rates Sheet" }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
          <RateCard 
            metal="Gold" 
            rate={rates.goldRate || (loading ? '' : 'N/A')} 
            bgColor="bg-gradient-to-br from-yellow-400 to-amber-600" 
            icon="fa-coins" 
          />
          <RateCard 
            metal="Silver" 
            rate={rates.silverRate || (loading ? '' : 'N/A')} 
            bgColor="bg-gradient-to-br from-gray-400 to-gray-600" 
            icon="fa-ring"
          />
        </div>
      </div>
    </section>
  );
};

export default LiveMetalRates; 