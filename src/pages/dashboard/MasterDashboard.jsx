import React, { useState, useEffect } from 'react';

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // IMPORTANT: Once deployed to Firebase, replace this with the live Firebase Cloud Function URL
  // e.g., https://us-central1-aarthika-backend.cloudfunctions.net/masterApi
  const FIREBASE_API_URL = 'https://us-central1-aarthika-backend.cloudfunctions.net/masterApi';

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (target) => {
    setLoading(true);
    setError('');
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

  const handleAddInventory = async (e) => {
    e.preventDefault();
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
        throw new Error(body.error || 'Failed to add inventory');
      }
      
      alert('Inventory added securely via Firebase!');
      e.target.reset();
      fetchData('inventory');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-light tracking-tight">Master <span className="font-semibold text-emerald-400">Dashboard</span></h1>
            <p className="text-zinc-400 mt-2">Centralized operations powered by Firebase Cloud Functions.</p>
          </div>
          
          <div className="flex gap-4">
            {['inventory', 'orders', 'passbook-ledger', 'metal-rates'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-transparent'}`}
              >
                {tab.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Data Viewer (Takes up 2 cols) */}
          <section className="lg:col-span-2 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-medium mb-4 capitalize">{activeTab.replace('-', ' ')} Database Viewer</h2>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center text-zinc-500">
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                  <p>Fetching from Firebase...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-64 flex items-center justify-center text-red-400 bg-red-950/20 rounded-lg border border-red-900/50">
                <p>Error: {error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-800/50 text-zinc-400">
                    <tr>
                      {data.length > 0 ? data[0].map((_, i) => (
                        <th key={i} className="px-4 py-3 font-medium">Col {i + 1}</th>
                      )) : (
                        <th className="px-4 py-3 font-medium">No Data Available</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {data.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-zinc-800/20 transition-colors">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-zinc-300">{cell || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Action Sidebar */}
          <section className="space-y-6">
            <div className="bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-zinc-800 p-6 shadow-xl">
              <h2 className="text-xl font-medium mb-6">Add New Inventory</h2>
              
              <form onSubmit={handleAddInventory} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Item Code</label>
                  <input required name="itemCode" type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. RING-001" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                  <select required name="category" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    <option value="Ring">Ring</option>
                    <option value="Necklace">Necklace</option>
                    <option value="Bangle">Bangle</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Weight (g)</label>
                    <input required name="weight" type="number" step="0.01" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Purity</label>
                    <input required name="purity" type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. 22K" />
                  </div>
                </div>
                
                <input type="hidden" name="addedBy" value="Master Admin" />

                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg px-4 py-3 transition-colors mt-4">
                  Push to Firebase
                </button>
              </form>
            </div>
            
            <div className="bg-blue-950/20 border border-blue-900/50 rounded-2xl p-5 text-sm text-blue-200">
              <p className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <span>Because this dashboard is powered by Firebase, it consumes <strong>0</strong> Vercel Serverless Function slots!</span>
              </p>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
