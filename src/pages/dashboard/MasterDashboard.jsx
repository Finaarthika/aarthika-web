import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, Package, ShoppingCart, Activity, FileText, 
  Users, Wallet, RefreshCw, Plus, Search, ChevronRight, CheckCircle2, CircleDollarSign
} from 'lucide-react';

const FIREBASE_API_URL = 'https://us-central1-aarthika-backend.cloudfunctions.net/masterApi';

// -- Shadcn-inspired UI Components --

const Card = ({ children, className = '' }) => (
  <div className={`bg-zinc-950 border border-zinc-800/60 rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 flex flex-col space-y-1.5 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight text-zinc-100 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-100',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/20'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// -- Main Application --

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [datasets, setDatasets] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const navigation = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Live Inventory', icon: Package },
    { id: 'custom-orders', label: 'Custom Orders', icon: ShoppingCart },
    { id: 'jewellery-sales', label: 'Sales DB', icon: CircleDollarSign },
    { id: 'old-jewellery', label: 'Old Gold DB', icon: RefreshCw },
    { id: 'vault-audit', label: 'Vault Audits', icon: Activity },
    { id: 'metal-rates', label: 'Metal Rates', icon: FileText },
    { id: 'staff-access', label: 'Staff Roster', icon: Users },
    { id: 'customer-profiles', label: 'Customer DB', icon: Users },
    { id: 'transaction-ledger', label: 'Tx Ledger', icon: Wallet },
    { id: 'savings-transaction', label: 'Savings DB', icon: Wallet },
  ];

  // Fetch initial datasets for overview
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchMultiple(['inventory', 'custom-orders', 'jewellery-sales']);
    } else {
      if (!datasets[activeTab]) {
        fetchData(activeTab);
      }
    }
  }, [activeTab]);

  const fetchData = async (target) => {
    setLoading(true);
    try {
      const res = await fetch(`${FIREBASE_API_URL}/read?target=${target}`);
      const body = await res.json();
      if (res.ok && body.success) {
        setDatasets(prev => ({ ...prev, [target]: body.data }));
      }
    } catch (err) {
      console.error(`Failed to fetch ${target}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMultiple = async (targets) => {
    setLoading(true);
    try {
      await Promise.all(targets.map(async (target) => {
        if (!datasets[target]) {
          const res = await fetch(`${FIREBASE_API_URL}/read?target=${target}`);
          const body = await res.json();
          if (res.ok && body.success) {
            setDatasets(prev => ({ ...prev, [target]: body.data }));
          }
        }
      }));
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
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
      
      if (!res.ok || !body.success) throw new Error(body.error || 'Failed');
      
      alert('Inventory Updated Successfully via Firebase!');
      e.target.reset();
      // Force refresh inventory
      fetchData('inventory');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- KPI Calculations ---
  
  const inventoryData = datasets['inventory'] || [];
  const ordersData = datasets['custom-orders'] || [];

  const kpis = useMemo(() => {
    let totalGoldWeight = 0;
    let totalSilverWeight = 0;
    
    // Parse Inventory (Skip header row 0)
    if (inventoryData.length > 1) {
      const headers = inventoryData[0];
      const metalTypeIdx = headers.indexOf('Metal Type');
      const expectedWtIdx = headers.indexOf('Expected Closing Weight (g)');
      
      if (metalTypeIdx > -1 && expectedWtIdx > -1) {
        for (let i = 1; i < inventoryData.length; i++) {
          const row = inventoryData[i];
          const type = (row[metalTypeIdx] || '').toLowerCase();
          const weight = parseFloat(row[expectedWtIdx] || 0);
          
          if (type.includes('gold')) totalGoldWeight += weight;
          if (type.includes('silver')) totalSilverWeight += weight;
        }
      }
    }

    // Parse Active Orders
    let activeOrdersCount = 0;
    if (ordersData.length > 1) {
      const headers = ordersData[0];
      const statusIdx = headers.findIndex(h => h && h.toLowerCase().includes('status'));
      if (statusIdx > -1) {
        for (let i = 1; i < ordersData.length; i++) {
          const status = (ordersData[i][statusIdx] || '').toLowerCase();
          if (status && !status.includes('fulfill') && !status.includes('complete')) {
            activeOrdersCount++;
          }
        }
      }
    }

    return {
      goldWt: totalGoldWeight.toFixed(2),
      silverWt: (totalSilverWeight / 1000).toFixed(2), // Convert to kg
      activeOrders: activeOrdersCount
    };
  }, [inventoryData, ordersData]);

  // Transform Inventory for Pie Chart
  const pieChartData = useMemo(() => {
    if (inventoryData.length <= 1) return [];
    const headers = inventoryData[0];
    const nameIdx = headers.indexOf('Category Name');
    const expectedWtIdx = headers.indexOf('Expected Closing Weight (g)');
    const metalTypeIdx = headers.indexOf('Metal Type');
    
    if (nameIdx === -1 || expectedWtIdx === -1) return [];
    
    return inventoryData.slice(1)
      .filter(row => (row[metalTypeIdx] || '').toLowerCase().includes('gold'))
      .map(row => ({
        name: row[nameIdx] || 'Unknown',
        value: parseFloat(row[expectedWtIdx] || 0)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [inventoryData]);

  const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

  // --- Rendering ---

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800/60 p-4 flex flex-col min-h-[auto] md:min-h-screen shrink-0 sticky top-0 z-20">
        <div className="mb-8 px-2 pt-2">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-500" />
            Control Panel
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Aarthika Finances v2.0</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navigation.map(nav => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                  ? 'bg-zinc-800/80 text-emerald-400' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                {nav.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-[1600px] overflow-hidden">
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Overview</h2>
              <p className="text-zinc-400 mt-1">Holistic view of your business metrics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Vault Gold</CardTitle>
                  <Package className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.goldWt} <span className="text-lg font-normal text-zinc-500">g</span></div>
                  <p className="text-xs text-zinc-500 mt-1">Based on Expected Closing Weight</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Vault Silver</CardTitle>
                  <Package className="w-4 h-4 text-zinc-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.silverWt} <span className="text-lg font-normal text-zinc-500">kg</span></div>
                  <p className="text-xs text-zinc-500 mt-1">Based on Expected Closing Weight</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Active Custom Orders</CardTitle>
                  <Activity className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.activeOrders}</div>
                  <p className="text-xs text-zinc-500 mt-1">Pending fulfillment in workshops</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Database Sync Status</CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold text-emerald-500 mt-1">Healthy</div>
                  <p className="text-xs text-zinc-500 mt-1">Connected via Cloud Functions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Gold Inventory Breakdown</CardTitle>
                  <p className="text-sm text-zinc-400">Top 5 categories by weight (grams)</p>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                      No chart data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Inventory Widget */}
              <Card className="col-span-1 border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Quick Add Inventory
                  </CardTitle>
                  <p className="text-sm text-zinc-400">Push live updates to the sheets.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateInventory} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-300">Category Name</label>
                      <input 
                        name="category"
                        required
                        placeholder="e.g. Gold Rings"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300">Added Count</label>
                        <input 
                          name="addedCount" type="number" required placeholder="0"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300">Added Wt (g)</label>
                        <input 
                          name="addedWeight" type="number" step="0.01" required placeholder="0.00"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-medium py-2 rounded-md text-sm transition-colors mt-2"
                    >
                      {actionLoading ? 'Updating Database...' : 'Push to Database'}
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 max-w-[calc(100vw-2rem)] md:max-w-full">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">{navigation.find(n => n.id === activeTab)?.label}</h2>
                <p className="text-zinc-400 mt-1">Raw database representation.</p>
              </div>
              <Badge variant="success">Live Sync Active</Badge>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto w-full custom-scrollbar">
                {loading ? (
                  <div className="h-[400px] flex items-center justify-center text-zinc-500 gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                    Fetching from server...
                  </div>
                ) : !datasets[activeTab] || datasets[activeTab].length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-zinc-500">
                    No data entries found.
                  </div>
                ) : (
                  <div className="min-w-max w-full">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-900/50 text-zinc-400 uppercase text-xs tracking-wider">
                        <tr>
                          {datasets[activeTab][0].map((header, i) => (
                            <th key={i} className="px-4 py-4 font-medium border-b border-zinc-800">{header || `Col ${i+1}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {datasets[activeTab].slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-zinc-900/30 transition-colors">
                            {datasets[activeTab][0].map((_, colIndex) => (
                              <td key={colIndex} className="px-4 py-3.5 text-zinc-300">
                                {row[colIndex] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {!loading && datasets[activeTab] && (
                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/50 text-xs text-zinc-500 flex justify-between">
                  <span>Showing {datasets[activeTab].length - 1} records</span>
                  <span>Data pulled via Firebase</span>
                </div>
              )}
            </Card>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #09090b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}} />
    </div>
  );
}
