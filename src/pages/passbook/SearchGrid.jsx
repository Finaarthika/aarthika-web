import React, { useState, useEffect } from 'react';

export default function SearchGrid() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLiveSheet() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/passbook/search');
        const json = await response.json();
        
        if (!response.ok) {
          throw new Error(json.error || json.details || 'Failed to fetch spreadsheet data');
        }
        
        setData(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLiveSheet();
  }, []);

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">Live Google Sheets Connection Test</h2>
      
      {loading && (
        <div className="p-6 bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded">
          Establishing live data connection to Google Sheets...
        </div>
      )}
      
      {error && (
        <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded mb-6">
          <strong className="block mb-2 text-lg">Backend Connection Error:</strong>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-4 border border-red-100 rounded">{error}</pre>
        </div>
      )}
      
      {!loading && !error && data.length === 0 && (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded font-bold text-slate-500">
          NO LIVE SPREADSHEET DATA FOUND
        </div>
      )}
      
      {!loading && !error && data.length > 0 && (
        <div className="overflow-x-auto shadow rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Father's Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Village</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.accountNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{row.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{row.fathersName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{row.village}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{row.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
