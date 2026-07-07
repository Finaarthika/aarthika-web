import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, Search, Activity, 
  DollarSign, TrendingUp, Wallet, RefreshCw,
  PieChart as PieChartIcon, BarChart3, AlertTriangle, CheckCircle
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
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    destructive: 'bg-red-50 text-red-700 border-red-200',
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
  const parts = dateStr.split(/[-/\s]/);
  
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      // Format: YYYY-MM-DD
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    } else {
      // Format: DD-MM-YYYY or DD-MM-YY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
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
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeChart, setActiveChart] = useState('sales');

  const TARGETS = [
    'inventory', 'custom-orders', 'jewellery-sales', 
    'old-jewellery', 'vault-audit', 'metal-rates', 
    'customer-profiles', 'transaction-ledger', 'inventory-addition'
  ];

  // Modified to use component state for custom dates
  const isWithinRange = useCallback((date, range) => {
    if (!date) return true; 
    if (range === 'all') return true;
    if (range === 'custom') {
       if (customDates.start && date < new Date(customDates.start)) return false;
       if (customDates.end) {
          const endDate = new Date(customDates.end);
          endDate.setHours(23, 59, 59, 999);
          if (date > endDate) return false;
       }
       return true;
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (range === 'today') return diffDays <= 1;
    if (range === '7d') return diffDays <= 7;
    if (range === '30d') return diffDays <= 30;
    if (range === '90d') return diffDays <= 90;
    return true; 
  }, [customDates]);

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
    let totalCOGS = 0;
    let makingCharges = 0;
    let scrapGoldBought = 0;
    let netSavings = 0;
    
    // Maps for the unified chart
    const trendMap = {}; 
    const ensureDate = (dateObj) => {
      const key = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!trendMap[key]) trendMap[key] = { date: key, sales: 0, makingCharges: 0, scrap: 0, savings: 0, cogs: 0, timestamp: dateObj.getTime() };
      return key;
    };

    // 0. Process Inventory Additions for COGS
    const categoryCosts = {};
    const additionData = datasets['inventory-addition'];
    if (additionData && Array.isArray(additionData) && additionData.length > 1) {
      const headers = additionData[0] || [];
      const catIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('category'));
      const weightIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('weight'));
      const priceIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('price'));
      const makingIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('making'));
      
      for (let i = 1; i < additionData.length; i++) {
        const row = additionData[i];
        if (!Array.isArray(row)) continue;
        const category = catIdx > -1 ? String(row[catIdx]) : '';
        const weight = weightIdx > -1 ? parseFloat(row[weightIdx]) : 0;
        const price = priceIdx > -1 ? parseFloat(String(row[priceIdx]).replace(/[^0-9.-]+/g,"")) : 0;
        const making = makingIdx > -1 ? parseFloat(String(row[makingIdx]).replace(/[^0-9.-]+/g,"")) : 0;
        
        if (category) {
          if (!categoryCosts[category]) categoryCosts[category] = { cost: 0, weight: 0 };
          categoryCosts[category].cost += (isNaN(price) ? 0 : price) + (isNaN(making) ? 0 : making);
          categoryCosts[category].weight += (isNaN(weight) ? 0 : weight);
        }
      }
    }
    const getAvgCost = (category) => {
      const cat = categoryCosts[category];
      if (!cat || cat.weight <= 0) return 0;
      return cat.cost / cat.weight;
    };

    const salesByCategory = {};

    // 1. Process Jewellery Sales
    const salesData = datasets['jewellery-sales'];
    if (salesData && Array.isArray(salesData) && salesData.length > 1) {
      const headers = salesData[0] || [];
      const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('date'));
      const totalIdx = headers.findIndex(h => h && (String(h).toLowerCase() === 'total' || String(h).toLowerCase() === 'total paid'));
      const labourIdx = headers.findIndex(h => h && (String(h).toLowerCase().includes('labour') || String(h).toLowerCase().includes('making')));
      
      // Find all ITEM type and weight indices (up to 6 items based on spreadsheet structure)
      const itemIndices = [];
      for (let j = 1; j <= 6; j++) {
        const tIdx = headers.findIndex(h => h && String(h).toLowerCase().includes(`item ${j}`) && String(h).toLowerCase().includes('type'));
        const wIdx = headers.findIndex(h => h && String(h).toLowerCase().includes(`item ${j}`) && (String(h).toLowerCase().includes('wt') || String(h).toLowerCase().includes('weight')));
        if (tIdx > -1 && wIdx > -1) {
           itemIndices.push({ tIdx, wIdx });
        }
      }
      
      for (let i = 1; i < salesData.length; i++) {
        const row = salesData[i];
        if (!Array.isArray(row)) continue;
        const d = parseDate(dateIdx > -1 ? row[dateIdx] : null);
        if (d && !isWithinRange(d, dateRange)) continue;

        const saleAmt = totalIdx > -1 ? parseFloat(row[totalIdx]) : 0;
        const labourAmt = labourIdx > -1 ? parseFloat(row[labourIdx]) : 0;
        
        const validSale = isNaN(saleAmt) ? 0 : saleAmt;
        const validLabour = isNaN(labourAmt) ? 0 : labourAmt;

        totalSales += validSale;
        makingCharges += validLabour;
        
        let cogs = 0;
        let validItemsFound = 0;

        for (const { tIdx, wIdx } of itemIndices) {
           const category = String(row[tIdx] || '').trim();
           const wStr = String(row[wIdx] || '').replace(/[^0-9.-]+/g,"");
           const weight = parseFloat(wStr);
           if (category && !isNaN(weight) && weight > 0) {
              cogs += weight * getAvgCost(category);
              validItemsFound++;
           }
        }
        
        totalCOGS += cogs;

        // Roughly split revenue across items for the pie chart
        if (validItemsFound > 0) {
           for (const { tIdx, wIdx } of itemIndices) {
               const category = String(row[tIdx] || '').trim();
               const weight = parseFloat(String(row[wIdx] || '').replace(/[^0-9.-]+/g,""));
               if (category && !isNaN(weight) && weight > 0) {
                  salesByCategory[category] = (salesByCategory[category] || 0) + (validSale / validItemsFound);
               }
           }
        }

        if (d) {
          const key = ensureDate(d);
          trendMap[key].sales += validSale;
          trendMap[key].makingCharges += validLabour;
          trendMap[key].cogs += cogs;
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
        const d = parseDate(dateIdx > -1 ? row[dateIdx] : null);
        if (d && !isWithinRange(d, dateRange)) continue;
        
        const amt = labourIdx > -1 ? parseFloat(row[labourIdx]) : 0;
        const validAmt = isNaN(amt) ? 0 : amt;
        makingCharges += validAmt;

        if (d) {
          const key = ensureDate(d);
          trendMap[key].makingCharges += validAmt;
        }
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
        const d = parseDate(dateIdx > -1 ? row[dateIdx] : null);
        if (d && !isWithinRange(d, dateRange)) continue;
        
        const valStr = totalValueIdx > -1 ? String(row[totalValueIdx] || '').replace(/[^0-9.-]+/g,"") : '';
        const val = parseFloat(valStr);
        const validVal = isNaN(val) ? 0 : val;
        scrapGoldBought += validVal;

        if (d) {
          const key = ensureDate(d);
          trendMap[key].scrap += validVal;
        }
      }
    }

    // 4. Process Savings Deposits & Withdrawals
    const ledgerData = datasets['transaction-ledger'];
    let recentLedger = [];
    if (ledgerData && Array.isArray(ledgerData) && ledgerData.length > 1) {
      const headers = ledgerData[0] || [];
      const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('timestamp'));
      const typeIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('transaction type'));
      const amtIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('amount'));
      
      for (let i = 1; i < ledgerData.length; i++) {
        const row = ledgerData[i];
        if (!Array.isArray(row)) continue;
        const d = parseDate(dateIdx > -1 ? row[dateIdx] : null);
        if (d && !isWithinRange(d, dateRange)) continue;
        
        const type = typeIdx > -1 ? String(row[typeIdx] || '').toUpperCase() : '';
        const amtStr = amtIdx > -1 ? String(row[amtIdx] || '').replace(/[^0-9.-]+/g,"") : '';
        const amt = parseFloat(amtStr);
        const validAmt = isNaN(amt) ? 0 : amt;

        if (type.includes('DEPOSIT')) {
           netSavings += validAmt;
           if (d) trendMap[ensureDate(d)].savings += validAmt;
        } else if (type.includes('WITHDRAWAL')) {
           netSavings -= validAmt;
           if (d) trendMap[ensureDate(d)].savings -= validAmt;
        }
      }
    }

    const trendData = Object.values(trendMap).sort((a, b) => a.timestamp - b.timestamp);
    
    // Convert salesByCategory to array for PieChart
    const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];
    const salesCategoryData = Object.keys(salesByCategory).map((key, index) => ({
      name: key,
      value: salesByCategory[key],
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    // 5. Process Audit Logs
    let auditMatches = 0;
    let auditAlerts = 0;
    let lastAuditDate = null;
    const auditData = datasets['vault-audit'];
    if (auditData && Array.isArray(auditData) && auditData.length > 1) {
       const headers = auditData[0] || [];
       const statusIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('status'));
       const dateIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('date'));
       
       for (let i = 1; i < auditData.length; i++) {
         const row = auditData[i];
         if (!Array.isArray(row)) continue;
         const d = parseDate(dateIdx > -1 ? row[dateIdx] : null);
         if (d && !isWithinRange(d, dateRange)) continue;

         const status = statusIdx > -1 ? String(row[statusIdx]).toLowerCase() : '';
         if (status.includes('match') || status.includes('pass')) auditMatches++;
         else if (status.includes('alert') || status.includes('mismatch') || status.includes('fail')) auditAlerts++;
         
         if (d && (!lastAuditDate || d > lastAuditDate)) {
            lastAuditDate = d;
         }
       }
    }
    const auditPassRate = (auditMatches + auditAlerts > 0) ? Math.round((auditMatches / (auditMatches + auditAlerts)) * 100) : 0;

    // 6. Inventory Chart Data
    const inventoryData = [];
    const lowStockAlerts = [];
    if (datasets['inventory'] && Array.isArray(datasets['inventory']) && datasets['inventory'].length > 1) {
      const invHeaders = datasets['inventory'][0] || [];
      const countIdx = invHeaders.findIndex(h => h && String(h).toLowerCase().includes('count'));
      const actualCountIdx = countIdx > -1 ? countIdx : 9;

      datasets['inventory'].slice(1).forEach(row => {
        if (!Array.isArray(row)) return;
        const category = row[0];
        const weight = parseFloat(row[10] || 0);
        
        // Low stock alert check
        const countStr = String(row[actualCountIdx] || '').replace(/[^0-9.-]+/g,"");
        const count = parseFloat(countStr);
        if (category && !isNaN(count) && count < 5) {
           lowStockAlerts.push({ name: String(category), count });
        }

        if (category && !isNaN(weight) && weight > 0) {
          const avgCost = getAvgCost(category);
          const capitalLocked = weight * avgCost;
          inventoryData.push({ name: String(category), weight, capitalLocked });
        }
      });
      lowStockAlerts.sort((a,b) => a.count - b.count);
    }

    return { 
      totalSales, totalCOGS, makingCharges, scrapGoldBought, netSavings, 
      trendData, salesCategoryData, inventoryData,
      auditPassRate, auditAlerts, lastAuditDate, lowStockAlerts
    };
  }, [datasets, dateRange, isWithinRange]);

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
          
          headers.forEach((h, idx) => {
            const headerStr = h ? String(h) : `Column ${idx + 1}`;
            itemObj[headerStr] = row[idx];
          });

          results.push({
            sheet: sheetName,
            data: itemObj
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
          <h2 className="text-sm font-medium tracking-widest uppercase">Aggregating Business Insights...</h2>
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
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Aarthika Command Center</h1>
          </div>
          
          {/* Global Search Bar */}
          <div className="w-full sm:w-[400px]">
             <Input 
               icon={Search} 
               placeholder="Global Insights Search..." 
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Insight Results for "{searchQuery}"</h2>
              <button onClick={() => setSearchQuery('')} className="text-sm text-blue-600 hover:underline font-medium">Clear Search</button>
            </div>
            <div className="text-sm text-zinc-500 mb-4">Found {searchResults.length} matching data points across all databases.</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((result, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="uppercase tracking-wider text-[10px] bg-white">
                        {result.sheet.replace('-', ' ')}
                      </Badge>
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
              <div className="flex flex-wrap items-center gap-2 bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Custom' }
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
                
                {dateRange === 'custom' && (
                   <div className="flex items-center gap-2 px-2 border-l border-zinc-200 ml-1">
                      <input 
                         type="date" 
                         className="text-xs border border-zinc-200 rounded px-2 py-1 text-zinc-700 bg-white" 
                         value={customDates.start}
                         onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                      />
                      <span className="text-zinc-400 text-xs">to</span>
                      <input 
                         type="date" 
                         className="text-xs border border-zinc-200 rounded px-2 py-1 text-zinc-700 bg-white" 
                         value={customDates.end}
                         onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                      />
                   </div>
                )}
              </div>
            </div>

            {/* Core Financial KPIs */}
            {kpis && (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Total Sales</CardTitle>
                    <DollarSign className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">₹{kpis.totalSales.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Total COGS</CardTitle>
                    <RefreshCw className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">₹{kpis.totalCOGS.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50/50 border-emerald-100">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700">Gross Profit</CardTitle>
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-emerald-700">₹{(kpis.totalSales - kpis.totalCOGS).toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Making Charges</CardTitle>
                    <Activity className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">₹{kpis.makingCharges.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Scrap Bought</CardTitle>
                    <RefreshCw className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">₹{kpis.scrapGoldBought.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500">Net Savings</CardTitle>
                    <Wallet className="h-4 w-4 text-zinc-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">₹{kpis.netSavings.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
              
              {/* Dynamic Trend Chart */}
              <Card className="col-span-12 lg:col-span-8 flex flex-col">
                <CardHeader className="pb-2 border-b border-zinc-100 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Business Trends</CardTitle>
                      <p className="text-sm text-zinc-500 mt-1">Visualizing selected date range.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-1 border border-zinc-200">
                       {[
                         { id: 'sales', label: 'Sales' },
                         { id: 'cogs', label: 'COGS' },
                         { id: 'makingCharges', label: 'Making Chg' },
                         { id: 'savings', label: 'Net Savings' }
                       ].map(metric => (
                         <button 
                           key={metric.id}
                           onClick={() => setActiveChart(metric.id)}
                           className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                             activeChart === metric.id ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                           }`}
                         >
                           {metric.label}
                         </button>
                       ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-[280px] w-full">
                    {kpis && kpis.trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={kpis.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#18181b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, activeChart.toUpperCase()]}
                          />
                          <Area type="monotone" dataKey={activeChart} stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorArea)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">Not enough data in this date range.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Audit Compliance Widget */}
              <Card className="col-span-12 lg:col-span-4 flex flex-col">
                <CardHeader>
                  <CardTitle>Vault Audit Compliance</CardTitle>
                  <p className="text-sm text-zinc-500">Security & reconciliation status.</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                   <div className="space-y-6">
                     <div className="text-center">
                        <div className="text-4xl font-bold tracking-tight text-zinc-900">{kpis?.auditPassRate || 0}%</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Match Rate</div>
                     </div>
                     <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                        <div>
                           <div className="text-xs text-zinc-500 uppercase tracking-wider">Active Alerts</div>
                           <div className={`text-lg font-bold ${kpis?.auditAlerts > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                             {kpis?.auditAlerts || 0}
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-zinc-500 uppercase tracking-wider">Last Audit</div>
                           <div className="text-sm font-medium text-zinc-900">
                             {kpis?.lastAuditDate ? kpis.lastAuditDate.toLocaleDateString('en-GB') : 'Never'}
                           </div>
                        </div>
                     </div>
                   </div>
                </CardContent>
              </Card>

            </div>

            {/* Bottom Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
              
              {/* Inventory Weight Distribution Bar Chart */}
              <Card className="col-span-12 lg:col-span-6 flex flex-col">
                <CardHeader className="pb-0 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-zinc-100 rounded-md">
                      <BarChart3 className="w-4 h-4 text-zinc-900" />
                    </div>
                    <div>
                      <CardTitle>Capital Locked in Inventory</CardTitle>
                      <p className="text-sm text-zinc-500">Estimated value of current stock (Cost Basis).</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                   <div className="h-[280px] w-full">
                     {kpis && kpis.inventoryData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={kpis.inventoryData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                           <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                           <Tooltip 
                             cursor={{ fill: '#f4f4f5' }}
                             contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             formatter={(value, name) => [name === 'capitalLocked' ? `₹${value.toLocaleString(undefined, {maximumFractionDigits: 0})}` : `${value} g`, name === 'capitalLocked' ? 'Value' : 'Weight']}
                           />
                           <Bar dataKey="capitalLocked" fill="#18181b" radius={[4, 4, 0, 0]} barSize={40} />
                         </BarChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="flex h-full items-center justify-center text-zinc-400 text-sm">No inventory data found.</div>
                     )}
                   </div>
                </CardContent>
              </Card>

              {/* Payment Methods Pie Chart */}
              <Card className="col-span-12 lg:col-span-3 flex flex-col">
                <CardHeader className="pb-0 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-zinc-100 rounded-md">
                      <PieChartIcon className="w-4 h-4 text-zinc-900" />
                    </div>
                    <div>
                      <CardTitle>Sales by Category</CardTitle>
                      <p className="text-sm text-zinc-500">Revenue distribution.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                   <div className="h-[280px] w-full">
                     {kpis && kpis.salesCategoryData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={kpis.salesCategoryData}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={90}
                             paddingAngle={5}
                             dataKey="value"
                           >
                             {kpis.salesCategoryData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                           </Pie>
                           <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                           />
                           <Legend verticalAlign="bottom" height={36} iconType="circle" />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="flex h-full items-center justify-center text-zinc-400 text-sm">No sales data in this range.</div>
                     )}
                   </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-12 lg:col-span-3 flex flex-col">
                <CardHeader className="pb-0 mb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2 pb-4">
                    <div className="p-2 bg-red-50 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-red-600">Low Stock Alerts</CardTitle>
                      <p className="text-sm text-zinc-500">Items below threshold (5 count).</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                   <div className="space-y-3">
                     {kpis && kpis.lowStockAlerts && kpis.lowStockAlerts.length > 0 ? (
                       kpis.lowStockAlerts.map((alert, idx) => (
                         <div key={idx} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-lg">
                           <span className="text-sm font-medium text-red-900">{alert.name}</span>
                           <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">{alert.count} left</span>
                         </div>
                       ))
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center space-y-2">
                          <CheckCircle className="w-8 h-8 text-emerald-500 opacity-50" />
                          <div className="text-sm">Stock levels are healthy.</div>
                       </div>
                     )}
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
