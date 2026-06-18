import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCircle, Loader2 } from 'lucide-react';

export default function SearchGrid() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live fetch from Vercel Serverless Function
  const fetchLiveCustomers = async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/passbook/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from backend.');
      }
      
      const json = await response.json();
      setCustomers(json.data || []);
      
    } catch (err) {
      console.error(err);
      setError('Could not connect to the live Google Sheets backend. Using fallback UI mode.');
      // Mock Fallback for local testing without Vercel backend
      setCustomers([
        {
          accountNumber: 'ACC-1001',
          customerName: 'Aman Kumar',
          fathersName: 'Suresh Kumar',
          village: 'Rampur Sec 2',
          phone: '98765-XXXXX',
        },
        {
          accountNumber: 'ACC-1002',
          customerName: 'Aman Kumar',
          fathersName: 'Ramesh Prasad',
          village: 'Main Bazar',
          phone: '91234-XXXXX',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLiveCustomers();
  }, []);

  const handleSearchTrigger = () => {
    fetchLiveCustomers(searchQuery);
  };

  // Trigger search on 'Enter' key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchTrigger();
    }
  };

  const handleViewUser = (accountNumber) => {
    navigate('/passbook/ledger', { state: { account_number: accountNumber } });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 mt-4 font-mono text-sm md:text-base">
      
      {error && (
        <div className="bg-orange-50 border-2 border-dashed border-orange-400 text-orange-800 px-4 py-2 text-center uppercase tracking-wider font-bold text-xs">
          [⚠] {error}
        </div>
      )}

      {/* Search Bar Section */}
      <div className="w-full flex items-center justify-between border-y-2 border-dashed border-slate-400 py-3 px-4 bg-white">
        <div className="flex items-center gap-4 w-full">
          <span className="font-semibold text-slate-800 uppercase tracking-widest whitespace-nowrap">
            SEARCH BAR:
          </span>
          <div className="flex-grow flex items-center gap-2">
            <span className="text-slate-500 font-bold">[</span>
            <input
              type="text"
              placeholder="Type to search live Database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
            />
            <span className="text-slate-500 font-bold">]</span>
          </div>
          <button 
            onClick={handleSearchTrigger}
            disabled={isLoading}
            className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            <span className="text-slate-500 font-bold">[</span>
            {isLoading ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Search className="w-5 h-5 text-blue-600" />}
            <span className="text-slate-500 font-bold">]</span>
          </button>
        </div>
      </div>

      {/* Tabular Multi-Row Grid */}
      <div className="w-full bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y border-dashed border-slate-400 text-slate-700">
              <th className="py-4 px-4 font-semibold border-r border-dashed border-slate-400 font-mono tracking-wider">Profile Image</th>
              <th className="py-4 px-4 font-semibold border-r border-dashed border-slate-400 font-mono tracking-wider">Customer Name</th>
              <th className="py-4 px-4 font-semibold border-r border-dashed border-slate-400 font-mono tracking-wider">Father's Name</th>
              <th className="py-4 px-4 font-semibold border-r border-dashed border-slate-400 font-mono tracking-wider">Village/Address</th>
              <th className="py-4 px-4 font-semibold border-r border-dashed border-slate-400 font-mono tracking-wider">Contact Number</th>
              <th className="py-4 px-4 font-semibold font-mono tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest border-b border-dashed border-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> FETCHING LIVE DATA...
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest border-b border-dashed border-slate-400">
                  NO ACCOUNTS FOUND
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr 
                  key={customer.accountNumber} 
                  className="border-b border-dashed border-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-4 border-r border-dashed border-slate-400">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      [ {customer.photoLink ? <img src={customer.photoLink} alt="Face" className="w-6 h-6 rounded-full object-cover" /> : <UserCircle className="w-5 h-5 text-slate-400" />} IMAGE ]
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-dashed border-slate-400 text-slate-800">
                    {customer.customerName}
                  </td>
                  <td className="py-4 px-4 border-r border-dashed border-slate-400 text-slate-600">
                    {customer.fathersName}
                  </td>
                  <td className="py-4 px-4 border-r border-dashed border-slate-400 text-slate-600">
                    {customer.village}
                  </td>
                  <td className="py-4 px-4 border-r border-dashed border-slate-400 text-slate-700">
                    {customer.phone}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleViewUser(customer.accountNumber)}
                      className="flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 transition-colors uppercase tracking-widest whitespace-nowrap"
                    >
                      [VIEW U]
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
