import React, { useEffect, useState } from 'react';
import premiumLogo from '../../assets/3.png';

export default function InvoicePrint() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Read the invoice data passed from the terminal
    const rawData = sessionStorage.getItem('aarthika_current_invoice');
    if (rawData) {
      setData(JSON.parse(rawData));
      // Wait for images and fonts to render, then open the print dialog
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, []);

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No invoice data found in session.</div>;

  const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

  return (
    <div className="bg-white text-black min-h-screen" style={{ fontFamily: '"Georgia", serif' }}>
      
      {/* 
        Print styling ensures this looks exactly like the Canva A4 portrait export.
      */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .no-print { display: none !important; }
          .print-container { padding: 15mm !important; }
        }
      `}</style>

      {/* Control Panel (Hidden during print) */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="text-sm">Native PDF Generation Active</div>
        <button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-sm font-bold tracking-widest uppercase font-sans">
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Canvas */}
      <div className="print-container max-w-[210mm] mx-auto p-12 bg-white">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <img src={premiumLogo} alt="Aarthika" className="h-10 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-normal tracking-[0.25em] uppercase mb-2 text-black">Mishra Jeweller's</h1>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase m-0">Purity • Trust • Heritage</p>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-300 w-full mb-8"></div>

        {/* Meta Section (Bill To / Invoice details) */}
        <div className="flex justify-between mb-12">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-2">Bill To</div>
            <div className="text-lg font-bold text-black mb-1">{data.customerName || 'Customer'}</div>
            <div className="text-sm text-gray-700">{data.customerPhone}</div>
            {data.customerVillage && <div className="text-sm text-gray-700">{data.customerVillage}</div>}
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-2">Tax Invoice</div>
            <div className="text-lg font-bold text-black mb-1">{data.invoiceNo}</div>
            <div className="text-sm text-gray-700">Date: {data.date}</div>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full text-left border-collapse mb-12">
          <thead>
            <tr>
              <th className="font-normal text-[10px] uppercase tracking-[0.15em] text-gray-500 pb-3 border-b-2 border-black">Description</th>
              <th className="font-normal text-[10px] uppercase tracking-[0.15em] text-gray-500 pb-3 border-b-2 border-black text-center">Purity</th>
              <th className="font-normal text-[10px] uppercase tracking-[0.15em] text-gray-500 pb-3 border-b-2 border-black text-center">Weight</th>
              <th className="font-normal text-[10px] uppercase tracking-[0.15em] text-gray-500 pb-3 border-b-2 border-black text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-6 text-sm text-black border-b border-gray-100">{data.metalType} {data.itemCategory}</td>
              <td className="py-6 text-sm text-black border-b border-gray-100 text-center">{data.purity}</td>
              <td className="py-6 text-sm text-black border-b border-gray-100 text-center">{data.netWeight} g</td>
              <td className="py-6 text-sm text-black border-b border-gray-100 text-right">{formatINR(data.metalValue)}</td>
            </tr>
          </tbody>
        </table>

        {/* Pricing Breakdown */}
        <div className="flex justify-end mb-16">
          <div className="w-[300px] sm:w-[350px]">
            <div className="flex justify-between py-1.5 text-[13px] text-gray-800">
              <span>Metal Value @ {formatINR(data.ratePerGram)}/g</span>
              <span>{formatINR(data.metalValue)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-[13px] text-gray-800">
              <span>Making Charges</span>
              <span>{formatINR(data.makingCharges)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between py-1.5 text-[13px] text-gray-800">
                <span>Discount</span>
                <span>-{formatINR(data.discount)}</span>
              </div>
            )}
            {data.gstAmount > 0 && (
              <div className="flex justify-between py-1.5 text-[13px] text-gray-800">
                <span>GST (3%)</span>
                <span>{formatINR(data.gstAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-4 mt-3 border-t-2 border-black border-b-2 font-bold text-lg text-black">
              <span className="uppercase tracking-[0.15em] text-sm">Grand Total</span>
              <span>{formatINR(data.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 mt-20">
          <p className="text-[11px] text-gray-500 italic mb-1">Thank you for shopping with Mishra Jeweller's.</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest">This is a computer generated invoice ({data.invoiceNo}).</p>
        </div>

      </div>
    </div>
  );
}
