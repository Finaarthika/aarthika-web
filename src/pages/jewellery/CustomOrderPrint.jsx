import React from 'react';
import logoTextUrl from '../../assets/Aarthika (1).png';

export default function CustomOrderPrint({ data }) {
  if (!data || !data.items) return null;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div id="custom-order-receipt" className="font-inter block bg-white">
      {data.items.map((item, index) => (
        <div 
          key={item.id || index} 
          className={`bg-white w-[1123px] h-[790px] relative box-border flex flex-col overflow-hidden ${index !== 0 ? 'html2pdf__page-break' : ''}`}
        >
          {/* Header */}
          <div className="bg-[#1B1464] text-white px-8 py-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-6">
              <img src={logoTextUrl} alt="Aarthika" className="h-10 object-contain brightness-0 invert opacity-90" />
              <div className="border-l border-white/20 pl-6">
                <h1 className="text-2xl font-black tracking-widest font-nirand">MISHRA JEWELLER'S</h1>
                <p className="text-[11px] text-white/70 font-bold uppercase tracking-[0.2em] mt-1">Enterprise Custom Workshop Slip</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/60 font-bold uppercase mb-1">Order ID / Slip No.</div>
              <div className="text-xl font-black tracking-wider bg-white/10 px-4 py-1.5 rounded-lg border border-white/20">
                {data.orderId} <span className="text-white/50 font-medium text-sm ml-2">[{index + 1}/{data.items.length}]</span>
              </div>
              <div className="text-[11px] text-white/60 font-bold mt-2 uppercase tracking-widest">{data.date}</div>
            </div>
          </div>

          <div className="flex-grow flex w-full relative">
            
            {/* LEFT COLUMN: Specs & Financials */}
            <div className="w-[45%] border-r-2 border-dashed border-gray-200 bg-[#FDFBF7] p-8 flex flex-col h-full">
              
              <div className="mb-8">
                <div className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-indigo-200">
                  Customer Profile
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="text-xl font-black text-gray-900 uppercase tracking-wide mb-1">{data.customerName}</div>
                  <div className="text-sm font-bold text-gray-600 tracking-wider mb-2">{data.customerPhone}</div>
                  {data.customerVillage && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {data.customerVillage}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <div className="inline-block bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-purple-200">
                  Target Specifications
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-100">
                    <div className="w-1/2 p-4 border-r border-gray-100 bg-gray-50/50">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</div>
                      <div className="text-lg font-black text-gray-800 uppercase tracking-wide">{item.category}</div>
                    </div>
                    <div className="w-1/2 p-4 bg-gray-50/50">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Metal</div>
                      <div className="text-lg font-black text-gray-800 uppercase tracking-wide">{item.metalType}</div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-1/2 p-4 border-r border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Purity</div>
                      <div className="text-lg font-black text-gray-800 uppercase tracking-wide">{item.purity}</div>
                    </div>
                    <div className="w-1/2 p-4 bg-indigo-50/30">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Expected Weight</div>
                      <div className="text-xl font-black text-indigo-900 tracking-wide">{item.expectedWeight} <span className="text-sm font-bold text-indigo-600">g</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="bg-green-50 rounded-2xl border border-green-200 p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Advance Deposit</div>
                    <div className="text-xs font-semibold text-green-700/70">(Applied to entire order)</div>
                  </div>
                  <div className="text-2xl font-black text-green-800">
                    {formatINR(parseFloat(data.advancePaid) || 0)}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Instructions & Photo */}
            <div className="w-[55%] p-8 flex flex-col h-full bg-white">
              
              <div className="mb-6 h-[120px] flex flex-col">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 border border-blue-100 self-start shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Custom Design Instructions
                </div>
                <div className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-inner relative overflow-hidden">
                  {item.notes ? (
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-sm">
                      No Written Instructions
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[430px] flex flex-col">
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 border border-amber-200 self-start shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  Visual Reference
                </div>
                <div className="flex-grow relative w-full flex items-start justify-start overflow-hidden">
                  {item.designPhoto ? (
                    <div className="relative inline-block h-full w-full">
                       <img src={item.designPhoto} alt="Design Reference" className="max-w-full h-full object-contain rounded-xl shadow-sm border border-gray-200" />
                       <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white flex flex-col items-start shadow-xl">
                         <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest">Target Item</span>
                         <span className="text-xs font-black uppercase tracking-wider">{item.category}</span>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                      <span className="font-bold uppercase tracking-widest text-xs opacity-50">No Reference Photo</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-[#1B1464] h-8 shrink-0 flex items-center px-8">
             <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] w-full text-center">
                INTERNAL WORKSHOP DOCUMENT • AARTHIKA SECURE LOG
             </span>
          </div>

        </div>
      ))}
    </div>
  );
}
