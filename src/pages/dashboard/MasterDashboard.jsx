import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Package, Search, Calendar, ChevronDown, Activity, 
  DollarSign, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, FileText, ExternalLink, RefreshCw
} from 'lucide-react';

const FIREBASE_API_URL = 'https://us-central1-aarthika-backend.cloudfunctions.net/masterApi';

// -- Shadcn UI Replicas --
const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'border-transparent bg-zinc-900 text-zinc-50',
    outline: 'text-zinc-950 border-zinc-200',
  };
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};
const Input = ({ className = '', icon: Icon, ...props }) => (
  <div className="relative flex items-center w-full">
    {Icon && <Icon className="absolute left-3 w-4 h-4 text-zinc-500" />}
    <input 
      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${Icon ? 'pl-9' : ''} ${className}`}
      {...props}
    />
  </div>
);

// -- Helper Functions --
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const isWithinRange = (date, range) => {
  if (!date) return true; 
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (range === 'today') return diffDays <= 1;
  if (range === '7d') return diffDays <= 7;
  if (range === '30d') return diffDays <= 30;
  if (range === '90d') return diffDays <= 90;
  return true; 
};

export default function MasterDashboard() {
  const [datasets, setDatasets] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');

  const TARGETS = [
    'inventory', 'custom-orders', 'jewellery-sales', 
    'old-jewellery', 'vault-audit', 'metal-rates', 
    'savings-transaction', 'customer-profiles'
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = {};
      await Promise.all(TARGETS.map(async (target) => {
        try {
          const res = await fetch(`${FIREBASE_API_URL}/read?target=${target}`);
          const body = await res.json();
          if (res.ok && body.success) {
            results[target] = body.data;
          }
        } catch (e) {
          console.error(`Failed to fetch ${target}`, e);
        }
      }));
      setDatasets(results);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Business Logic & KPI Calculation ---
  const kpis = useMemo(() => {
    let totalSales = 0;
    let makingCharges = 0;
    let scrapGoldBought = 0;
    let savingsDeposits = 0;
    const salesTrendMap = {}; 

    // 1. Process Jewellery Sales
    const salesData = datasets['jewellery-sales'];
    if (salesData && Array.isArray(salesData) && salesData.length > 1) {
      const headers = salesData[0] || [];
      const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('date'));
      const totalIdx = headers.findIndex(h => h && (String(h).toLowerCase() === 'total' || String(h).toLowerCase() === 'total paid'));
      const labourIdx = headers.findIndex(h => h && (String(h).toLowerCase().includes('labour') || String(h).toLowerCase().includes('making')));
      
      for (let i = 1; i < salesData.length; i++) {
        const row = salesData[i];
        if (!Array.isArray(row)) continue;
        const dateStr = dateIdx > -1 ? row[dateIdx] : null;
        const d = parseDate(dateStr);
        if (d && !isWithinRange(d, dateRange)) continue;

        const saleAmt = totalIdx > -1 ? parseFloat(row[totalIdx]) : 0;
        const labourAmt = labourIdx > -1 ? parseFloat(row[labourIdx]) : 0;
        
        totalSales += (isNaN(saleAmt) ? 0 : saleAmt);
        makingCharges += (isNaN(labourAmt) ? 0 : labourAmt);

        if (d && !isNaN(saleAmt)) {
          const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          salesTrendMap[key] = (salesTrendMap[key] || 0) + saleAmt;
        }
      }
    }

    // 2. Process Custom Orders (Making Charges)
    const ordersData = datasets['custom-orders'];
    if (ordersData && Array.isArray(ordersData) && ordersData.length > 1) {
      const headers = ordersData[0] || [];
      const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('date'));
      const labourIdx = headers.findIndex(h => h && (String(h).toLowerCase().includes('labour') || String(h).toLowerCase().includes('making')));
      
      for (let i = 1; i < ordersData.length; i++) {
        const row = ordersData[i];
        if (!Array.isArray(row)) continue;
        const d = dateIdx > -1 ? parseDate(row[dateIdx]) : null;
        if (d && !isWithinRange(d, dateRange)) continue;
        const amt = labourIdx > -1 ? parseFloat(row[labourIdx]) : 0;
        makingCharges += (isNaN(amt) ? 0 : amt);
      }
    }

    // 3. Process Old Gold Scrap
    const scrapData = datasets['old-jewellery'];
    if (scrapData && Array.isArray(scrapData) && scrapData.length > 1) {
      const headers = scrapData[0] || [];
      const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('date'));
      const totalValueIdx = headers.findIndex(h => h && (String(h).toLowerCase().includes('total value') || String(h).toLowerCase().includes('final value')));
      
      for (let i = 1; i < scrapData.length; i++) {
        const row = scrapData[i];
        if (!Array.isArray(row)) continue;
        const d = dateIdx > -1 ? parseDate(row[dateIdx]) : null;
        if (d && !isWithinRange(d, dateRange)) continue;
        const valStr = totalValueIdx > -1 ? String(row[totalValueIdx] || '').replace(/[^0-9.-]+/g,"") : '';
        const val = parseFloat(valStr);
        scrapGoldBought += (isNaN(val) ? 0 : val);
      }
    }

    // 4. Process Savings Deposits
    const savingsData = datasets['savings-transaction'];
    if (savingsData && Array.isArray(savingsData) && savingsData.length > 1) {
      const headers = savingsData[0] || [];
      const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('date'));
      const amtIdx = headers.findIndex(h => h && (String(h).toLowerCase().includes('deposit') || String(h).toLowerCase() === 'amount' || String(h).toLowerCase().includes('received')));
      const typeIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('type'));
      
      for (let i = 1; i < savingsData.length; i++) {
        const row = savingsData[i];
        if (!Array.isArray(row)) continue;
        const d = dateIdx > -1 ? parseDate(row[dateIdx]) : null;
        if (d && !isWithinRange(d, dateRange)) continue;
        
        const type = typeIdx > -1 ? String(row[typeIdx] || '').toLowerCase() : '';
        if (type.includes('deposit') || typeIdx === -1) {
           const amt = amtIdx > -1 ? parseFloat(row[amtIdx]) : 0;
           savingsDeposits += (isNaN(amt) ? 0 : amt);
        }
      }
    }

    const trendData = Object.keys(salesTrendMap).sort((a, b) => new Date(a) - new Date(b)).map(k => ({
      date: k,
      sales: salesTrendMap[k]
    }));

    return { totalSales, makingCharges, scrapGoldBought, savingsDeposits, trendData };
  }, [datasets, dateRange]);

  // --- Global Search Logic ---
  const searchResults = useMemo(() => {
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length < 2) return null;
    const results = [];
    const query = searchQuery.toLowerCase();

    Object.keys(datasets).forEach(sheetName => {
      const sheetData = datasets[sheetName];
      if (!sheetData || !Array.isArray(sheetData) || sheetData.length <= 1) return;
      const headers = sheetData[0];
      if (!Array.isArray(headers)) return;

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!Array.isArray(row)) continue;
        
        const rowStr = row.join(' ').toLowerCase();
        if (rowStr.includes(query)) {
          const itemObj = {};
          let pdfLink = null;
          
          headers.forEach((h, idx) => {
            const headerStr = h ? String(h) : `Column ${idx + 1}`;
            itemObj[headerStr] = row[idx];
            const headerLower = headerStr.toLowerCase();
            if (headerLower.includes('pdf') || headerLower.includes('drive') || headerLower.includes('link')) {
               if (typeof row[idx] === 'string' && row[idx].includes('http')) {
                 pdfLink = row[idx];
               }
            }
          });

          results.push({
            sheet: sheetName,
            data: itemObj,
            pdfLink
          });
        }
      }
    });
    return results;
  }, [searchQuery, datasets]);


  // --- Render ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <Activity className="w-8 h-8 animate-pulse text-zinc-900" />
          <h2 className="text-sm font-medium tracking-widest uppercase">Aggregating Business Data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-950 font-sans pb-20">
      
      {/* Top Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 max-w-[1600px] mx-auto gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Aarthika Command Center</h1>
          </div>
          
          {/* Global Search Bar */}
          <div className="w-full sm:w-[400px]">
             <Input 
               icon={Search} 
               placeholder="Global Search (Customer, Order ID, Phone...)" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>
      </div>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* If searching, show only search results */}
        {searchResults !== null ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Search Results for "{searchQuery}"</h2>
            <div className="text-sm text-zinc-500 mb-4">Found {searchResults.length} matching records across all databases.</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((result, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="uppercase tracking-wider text-[10px] bg-white">
                        {result.sheet.replace('-', ' ')}
                      </Badge>
                      {result.pdfLink && (
                        <a href={result.pdfLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium gap-1">
                          <FileText className="w-3 h-3" /> View Doc
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {Object.entries(result.data).map(([k, v]) => {
                      if (!v || v === '-' || !k) return null;
                      const kStr = String(k).toLowerCase();
                      if (kStr.includes('pdf') || kStr.includes('link') || kStr.includes('drive')) return null;
                      return (
                        <div key={k} className="flex justify-between border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{k}</span>
                          <span className="text-sm font-medium text-zinc-900 text-right max-w-[60%] truncate" title={String(v)}>{String(v)}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
                <Search className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-zinc-900">No results found</h3>
                <p className="text-sm text-zinc-500">Try a different name, order ID, or phone number.</p>
              </div>
            )}
          </div>
        ) : (
          /* Normal Dashboard View */
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Business Overview</h2>
                <p className="text-zinc-500 mt-1">Real-time financial metrics and operational performance.</p>
              </div>
              
              {/* Date Filter Dropdown */}
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'all', label: 'All Time' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDateRange(opt.id)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      dateRange === opt.id ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Financial KPIs */}
            {kpis && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Total Sales Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{kpis.totalSales.toLocaleString()}</div>
                    <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" /> Metrics based on selected date range
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Making Charges Earned</CardTitle>
                    <Activity className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{kpis.makingCharges.toLocaleString()}</div>
                    <p className="text-xs text-zinc-500 mt-1">Pure profit from labor & craft</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Old Scrap Gold Bought</CardTitle>
                    <RefreshCw className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{kpis.scrapGoldBought.toLocaleString()}</div>
                    <p className="text-xs text-zinc-500 mt-1">Value of old jewellery purchased</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Savings Deposits</CardTitle>
                    <Wallet className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{kpis.savingsDeposits.toLocaleString()}</div>
                    <p className="text-xs text-zinc-500 mt-1">Total customer deposits collected</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Sales Trend Chart */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                  <p className="text-sm text-zinc-500">Daily sales revenue visualization.</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    {kpis && kpis.trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={kpis.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#18181b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                          />
                          <Area type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">Not enough data in this date range.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Levels Snapshot */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Live Inventory Snapshot</CardTitle>
                  <p className="text-sm text-zinc-500">Current vault holdings.</p>
                </CardHeader>
                <CardContent>
                   <div className="space-y-6 mt-4">
                     {datasets['inventory'] && datasets['inventory'].slice(1, 6).map((row, i) => {
                       if (!Array.isArray(row)) return null;
                       const category = row[0];
                       const weight = parseFloat(row[10] || 0);
                       const count = row[9];
                       const status = row[11];
                       if (!category) return null;
                       
                       return (
                         <div key={i} className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0">
                           <div>
                             <div className="font-medium text-zinc-900">{String(category)}</div>
                             <div className="text-xs text-zinc-500">{String(count)} Items in Vault</div>
                           </div>
                           <div className="text-right">
                             <div className="font-bold text-zinc-900">{isNaN(weight) ? '0.00' : weight.toFixed(2)} g</div>
                             {status && String(status).includes('DEEP') ? (
                               <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{String(status)}</span>
                             ) : (
                               <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Verified</span>
                             )}
                           </div>
                         </div>
                       )
                     })}
                   </div>
                   <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
                     <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center w-full gap-1">
                       View Full Inventory Book <ArrowUpRight className="w-4 h-4" />
                     </button>
                   </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
