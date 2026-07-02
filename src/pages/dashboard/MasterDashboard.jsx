import React, { useState, useEffect } from 'react';

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Live Firebase Cloud Function URL
  const FIREBASE_API_URL = 'https://us-central1-aarthika-backend.cloudfunctions.net/masterApi';

  const tabs = [
    { id: 'inventory', label: 'Inventory (Live)' },
    { id: 'custom-orders', label: 'Custom Orders' },
    { id: 'jewellery-sales', label: 'Sales DB' },
    { id: 'old-jewellery', label: 'Old Purchase DB' },
    { id: 'vault-audit', label: 'Vault Audits' },
    { id: 'metal-rates', label: 'Metal Rates' },
    { id: 'staff-access', label: 'Staff Roster' },
    { id: 'customer-profiles', label: 'Customer DB' },
    { id: 'transaction-ledger', label: 'Tx Ledger' },
    { id: 'savings-transaction', label: 'Savings DB' },
  ];

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (target) => {
    setLoading(true);
    setError('');
    setData([]);
    try {
      const res = await fetch(`${FIREBASE_API_URL}/read?target=${target}`);
      const body = await res.json();
      
      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Failed to fetch data');
      }
      
      setData(body.data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      const res = await fetch(`${FIREBASE_API_URL}/add-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      
      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Failed to update inventory');
      }
      
      alert('Inventory Updated Successfully via Firebase!');
      e.target.reset();
      if (activeTab === 'inventory') fetchData('inventory');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-6 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">Master <span className="font-semibold text-emerald-400">Dashboard</span></h1>
            <p className="text-zinc-400 mt-2 text-lg">Centralized secure access to all Google Sheets data.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 backdrop-blur-xl">
              <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-4 px-2">Databases</h3>
              <div className="flex flex-col gap-1">
                {tabs.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between ${
                      activeTab === tab.id 
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-500/20' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Inventory Form */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Update Inventory</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-6">Instantly updates the 'Added Count' and 'Added Weight' for a category.</p>
              
              <form onSubmit={handleUpdateInventory} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Category Name (Exact Match)</label>
                  <input 
                    name="category"
                    type="text" 
                    required
                    placeholder="e.g. Gold Rings"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Added Count</label>
                    <input 
                      name="addedCount"
                      type="number" 
                      required
                      placeholder="e.g. 5"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Added Wt (g)</label>
                    <input 
                      name="addedWeight"
                      type="number" 
                      step="0.01"
                      required
                      placeholder="e.g. 15.50"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Push to Live Database'}
                </button>
              </form>
            </div>
          </aside>

          {/* Main Data Viewer */}
          <main className="lg:col-span-3">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl backdrop-blur-xl h-full min-h-[600px] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-lg font-medium text-white flex items-center gap-3">
                  {tabs.find(t => t.id === activeTab)?.label}
                  <span className="text-xs font-normal px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md">Live Sync</span>
                </h2>
                {!loading && data.length > 0 && (
                  <span className="text-xs text-zinc-500">{data.length - 1} Records Found</span>
                )}
              </div>

              <div className="flex-1 overflow-auto p-0 custom-scrollbar">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 min-h-[400px]">
                    <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <p className="text-sm font-medium tracking-wide animate-pulse">Synchronizing with Google Workspace...</p>
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center p-8 min-h-[400px]">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
                      <svg className="w-8 h-8 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-red-400 font-medium mb-1">Connection Error</h3>
                      <p className="text-sm text-red-400/80 break-words">{error}</p>
                    </div>
                  </div>
                ) : data.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 min-h-[400px]">
                    <p>No data available in this sheet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead className="bg-zinc-950/80 sticky top-0 backdrop-blur-md z-10 shadow-sm">
                      <tr>
                        {data[0].map((header, i) => (
                          <th key={i} className="px-5 py-4 font-medium text-zinc-300 border-b border-zinc-800 tracking-wide">{header || `Col ${i+1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {data.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-zinc-800/30 transition-colors group">
                          {data[0].map((_, colIndex) => (
                            <td key={colIndex} className="px-5 py-3 text-zinc-400 group-hover:text-zinc-300">
                              {row[colIndex] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}} />
    </div>
  );
}
