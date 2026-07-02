import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, Package, ShoppingCart, Activity, FileText, 
  Users, Wallet, RefreshCw, Plus, CreditCard, DollarSign
} from 'lucide-react';

const FIREBASE_API_URL = 'https://us-central1-aarthika-backend.cloudfunctions.net/masterApi';

// -- Exact Shadcn UI Replicas --

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-zinc-500 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80',
    secondary: 'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80',
    outline: 'text-zinc-950 border-zinc-200',
  };
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${variants[variant]}`}>
      {children}
    </div>
  );
};

const Button = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 shadow',
    outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900',
    ghost: 'hover:bg-zinc-100 hover:text-zinc-900'
  };
  return (
    <button 
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

// -- Main Application --

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [datasets, setDatasets] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const navigation = [
    { id: 'overview', label: 'Overview' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'custom-orders', label: 'Orders' },
    { id: 'jewellery-sales', label: 'Sales' },
    { id: 'old-jewellery', label: 'Old Gold' },
    { id: 'vault-audit', label: 'Vault Audits' },
    { id: 'metal-rates', label: 'Metal Rates' },
    { id: 'staff-access', label: 'Staff' },
    { id: 'customer-profiles', label: 'Customers' },
    { id: 'transaction-ledger', label: 'Ledger' },
    { id: 'savings-transaction', label: 'Savings' },
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
      silverWt: (totalSilverWeight / 1000).toFixed(2), 
      activeOrders: activeOrdersCount
    };
  }, [inventoryData, ordersData]);

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
      .slice(0, 5); 
  }, [inventoryData]);

  const COLORS = ['#09090b', '#27272a', '#52525b', '#71717a', '#a1a1aa'];

  // --- Rendering ---

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans">
      
      {/* Top Navbar */}
      <div className="border-b border-zinc-200">
        <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto">
          <h2 className="text-xl font-bold tracking-tight mr-8 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </h2>
          
          {/* Top Horizontal Tabs */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.slice(0, 5).map(nav => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`text-sm font-medium transition-colors px-4 py-2 rounded-md ${
                  activeTab === nav.id 
                  ? 'text-zinc-900 bg-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="hidden sm:inline-flex">Live Cloud Sync</Badge>
          </div>
        </div>
      </div>

      {/* Secondary Mobile/Overflow Tabs */}
      <div className="border-b border-zinc-200 bg-zinc-50/50 md:hidden">
        <div className="flex overflow-x-auto p-2 space-x-1 no-scrollbar">
          {navigation.map(nav => (
             <button
             key={nav.id}
             onClick={() => setActiveTab(nav.id)}
             className={`whitespace-nowrap text-sm font-medium transition-colors px-4 py-2 rounded-md ${
               activeTab === nav.id 
               ? 'text-zinc-900 bg-white shadow-sm ring-1 ring-zinc-200' 
               : 'text-zinc-500 hover:text-zinc-900'
             }`}
           >
             {nav.label}
           </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto">
        
        {/* Full Desktop Tab List below header */}
        <div className="hidden md:flex items-center justify-between space-y-2 mb-6">
           <div className="bg-zinc-100/80 p-1 rounded-lg inline-flex flex-wrap gap-1">
             {navigation.map(nav => (
                <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${
                  activeTab === nav.id 
                  ? 'bg-white text-zinc-950 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-950'
                }`}
              >
                {nav.label}
              </button>
             ))}
           </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Gold Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.goldWt} g</div>
                  <p className="text-xs text-zinc-500">Expected vault closing weight</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Silver Value</CardTitle>
                  <CreditCard className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.silverWt} kg</div>
                  <p className="text-xs text-zinc-500">Expected vault closing weight</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                  <Activity className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{kpis.activeOrders}</div>
                  <p className="text-xs text-zinc-500">Pending fulfillment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-950">Online</div>
                  <p className="text-xs text-zinc-500">Google Cloud synced</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Gold Inventory Breakdown</CardTitle>
                  <CardDescription>Top 5 categories by weight distribution.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[350px] w-full mt-4">
                    {pieChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pieChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}g`}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f4f4f5' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#09090b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                        No chart data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Add Inventory Widget */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Update Inventory</CardTitle>
                  <CardDescription>Push live count and weight updates to the sheet.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateInventory} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Category Name</label>
                      <Input name="category" required placeholder="e.g. Gold Rings" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Added Count</label>
                        <Input name="addedCount" type="number" required placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Added Wt (g)</label>
                        <Input name="addedWeight" type="number" step="0.01" required placeholder="0.00" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={actionLoading}>
                      {actionLoading ? 'Updating Database...' : 'Push to Database'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Dynamic Data Table Rendering */}
        {activeTab !== 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Card className="overflow-hidden flex flex-col border-zinc-200 shadow-sm bg-white">
              <div className="overflow-x-auto w-full custom-scrollbar">
                {loading ? (
                  <div className="h-[400px] flex items-center justify-center text-zinc-500 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Fetching data...</span>
                  </div>
                ) : !datasets[activeTab] || datasets[activeTab].length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-zinc-500 text-sm">
                    No data entries found.
                  </div>
                ) : (
                  <div className="w-full min-w-max">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50/50">
                        <tr className="border-b border-zinc-200">
                          {datasets[activeTab][0].map((header, i) => (
                            <th key={i} className="h-12 px-4 text-left align-middle font-medium text-zinc-500">
                              {header || `Col ${i+1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {datasets[activeTab].slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-100">
                            {datasets[activeTab][0].map((_, colIndex) => (
                              <td key={colIndex} className="p-4 align-middle text-zinc-700">
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
                <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-200 text-sm text-zinc-500 bg-white">
                  <span>Showing {datasets[activeTab].length - 1} records</span>
                  <span>Data synced with Cloud</span>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f4f5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4d4d8;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1aa;
        }
      `}} />
    </div>
  );
}
