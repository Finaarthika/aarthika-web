import React from 'react';
import logoTextUrl from '../../assets/Aarthika (1).png';

export default function CustomOrderPrint({ data }) {
  if (!data) return null;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div id="custom-order-receipt" className="bg-white w-[148mm] h-[210mm] overflow-hidden relative font-inter flex flex-col box-border border-b-[8px] border-indigo-900">
      
      {/* Header */}
      <div className="bg-[#1B1464] text-white p-6 relative">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <img src={logoTextUrl} alt="Aarthika" className="h-6 object-contain mb-2 brightness-0 invert opacity-90" />
            <h1 className="text-xl font-black tracking-tight font-nirand">MISHRA JEWELLER'S</h1>
            <p className="text-[10px] text-white/70 font-semibold uppercase tracking-widest mt-1">Custom Order Slip</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/60 font-bold uppercase mb-1">Order ID</div>
            <div className="text-sm font-black tracking-wider bg-white/10 px-3 py-1 rounded-md border border-white/20">{data.orderId}</div>
            <div className="text-[9px] text-white/60 font-medium mt-2">{data.date}</div>
          </div>
        </div>
      </div>

      <div className="flex-grow p-6 flex flex-col gap-6">
        
        {/* Customer & Spec Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Details</h3>
            <div className="text-sm font-black text-gray-800 uppercase mb-1">{data.customerName}</div>
            <div className="text-xs font-semibold text-gray-600 mb-1">{data.customerPhone}</div>
            {data.customerVillage && <div className="text-[10px] font-medium text-gray-500 uppercase">{data.customerVillage}</div>}
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Order Specs</h3>
            <div className="flex justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-500">Category:</span>
              <span className="text-[11px] font-black text-indigo-900 uppercase">{data.category}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-500">Metal:</span>
              <span className="text-[11px] font-black text-indigo-900">{data.metalType} ({data.purity})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Expected Wt:</span>
              <span className="text-[11px] font-black text-indigo-900">{data.expectedWeight} g</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex-grow flex flex-col">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Design Instructions</h3>
          <div className="flex-grow bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
            {data.notes || "No special instructions provided."}
          </div>
        </div>

        {/* Design Photo */}
        <div className="h-[200px] border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 relative">
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 text-[9px] font-bold text-gray-500 uppercase tracking-widest z-10">
            Design Reference
          </div>
          {data.designPhoto ? (
             <img src={data.designPhoto} alt="Design" className="w-full h-full object-contain" />
          ) : (
             <span className="text-gray-300 font-bold text-sm uppercase tracking-widest">No Reference Photo</span>
          )}
        </div>

      </div>

      {/* Footer Financials */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Processed By</div>
          <div className="text-xs font-black text-gray-800 uppercase">{data.staffName || 'System'}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-1">Advance Deposit Received</div>
          <div className="text-xl font-black text-green-700">{formatINR(parseFloat(data.advancePaid) || 0)}</div>
        </div>
      </div>

    </div>
  );
}
