import React from 'react';
import premiumLogo from '../../assets/3.png';
import watermarkImg from '../../assets/watermark.png';

export default function DetailedA4Receipt({ data, id = "detailed-a4-receipt" }) {
  if (!data) return null;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const silverItems = data.items?.filter(i => i.metalType === 'Silver') || [];
  const goldItems = data.items?.filter(i => i.metalType === 'Gold') || []; 
  const totalItemsCount = silverItems.length + goldItems.length;
  const isCrowded = totalItemsCount >= 4;

  return (
    <div id={id} className="w-[1040px] h-[720px] bg-white text-black flex flex-col relative overflow-hidden box-border" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;800&display=swap');
          .font-nirand { font-family: "Nirand", "Red Hat Display", sans-serif; }
          .font-redhat { font-family: "Red Hat Display", sans-serif; }
        `}
      </style>

      {/* Main Split Content */}
      <div className="flex w-full flex-grow min-h-0 bg-[#F8F9FA]">
        
        {/* ======================================= */}
        {/* LEFT COLUMN: THE A5 RECEIPT AESTHETIC   */}
        {/* ======================================= */}
        <div className="w-[520px] h-full flex flex-col bg-white px-5 pt-1 relative shadow-r border-r-2 border-gray-300">
          
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
            <img src={watermarkImg} alt="Watermark" className="w-[80%] object-contain grayscale" />
          </div>

          <div className="flex flex-col relative z-10 h-full justify-between pb-2">
            
            {/* Header */}
            <div className="flex justify-between items-center py-2 border-b-[2px] border-gray-300 shrink-0">
              <div className="flex-shrink-0">
                <h1 className="text-[28px] font-normal tracking-wide font-redhat leading-none whitespace-nowrap" style={{ color: '#1B1464' }}>
                  MISHRA JEWELER'S
                </h1>
                <p className="text-[10px] font-bold tracking-[0.1em] mt-1 uppercase whitespace-nowrap" style={{ color: '#1B1464' }}>
                  GOLD & SILVER
                </p>
              </div>
              <div className="flex flex-col gap-1 border-l-[2px] border-black pl-4 py-1 ml-6 text-right" style={{ color: '#1B1464' }}>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] font-semibold">+91-6205168541</span>
                  <svg className="w-[12px] h-[12px] text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                  </svg>
                </div>
                <div className="flex items-start justify-end gap-1.5">
                  <span className="text-[9px] leading-tight font-semibold">
                    Dharampur, Uttar Dinajpur<br/>
                    Pin Code : 733210
                  </span>
                  <svg className="w-[14px] h-[14px] text-black mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start mb-1 shrink-0 mt-1">
              <div>
                <h2 className="text-[28px] mb-2 font-normal font-nirand leading-none tracking-wide" style={{ color: '#1B1464' }}>INVOICE</h2>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1.5 text-[12px] font-bold text-gray-700">
                  <span>Invoice date:</span>
                  <span className="text-black font-normal">{data.date}</span>
                  <span>Invoice Number:</span>
                  <span className="text-black font-normal uppercase">{data.invoiceNo}</span>
                </div>
              </div>
              <div className="flex flex-col items-center pt-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest text-center">INVOICE TO</div>
                <div className="text-[14px] font-bold text-gray-800 tracking-wide uppercase text-center">{data.customerName || 'Customer'}</div>
                <div className="text-[12px] text-gray-500 font-bold leading-relaxed space-y-1.5">+91-{data.customerPhone}</div>
                {data.customerVillage && <div className="text-[11px] text-gray-500 font-bold mt-0.5 text-center">{data.customerVillage}</div>}
              </div>
            </div>

            {/* Table */}
            <div className="w-full mb-1 border border-gray-200 flex flex-col flex-grow min-h-0 overflow-hidden">
              <div className="grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] bg-[#F8F9FA] py-1 px-3 border-b border-gray-200 shrink-0">
                <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand">Descriptions</div>
                <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Gross Weight</div>
                <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Net Weight</div>
                <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Rate ₹</div>
                <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-right">Amount ₹</div>
              </div>
              <div className="flex flex-col flex-grow bg-white pb-2">
                {silverItems.length > 0 && (
                  <div className="mb-0">
                    <div className={`text-[11px] font-bold text-[#1B1464] uppercase px-3 ${isCrowded ? 'pt-0.5 pb-0' : 'pt-2 pb-0.5'} font-nirand tracking-widest`}>SILVER</div>
                    {silverItems.map((item, idx) => {
                      const netW = parseFloat(item.netWeight) || 0;
                      const rate = parseFloat(item.rate) || 0;
                      const purityMult = item.purity ? (item.purity.includes('%') ? parseFloat(item.purity)/100 : (item.purity.includes('K') ? parseFloat(item.purity)/24 : 1)) : 1;
                      const effRate = rate * purityMult;
                      return (
                        <div key={`s-${idx}`} className={`grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] ${isCrowded ? 'py-[0px]' : 'py-[5px]'} px-3 items-center`}>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 uppercase`}>{item.category} ({item.purity})</div>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.grossWeight || item.netWeight} g</div>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.netWeight} g</div>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{formatINR(rate).replace('₹', '').trim()}</div>
                          <div className={`${isCrowded ? 'text-[10px]' : 'text-[11.5px]'} font-extrabold text-black text-right`}>{formatINR(netW * effRate).replace('₹', '').trim()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {goldItems.length > 0 && (
                  <div className="mb-0">
                    <div className={`text-[11px] font-bold text-[#1B1464] uppercase px-3 ${isCrowded ? 'pt-0.5 pb-0' : 'pt-2 pb-0.5'} font-nirand tracking-widest`}>GOLD</div>
                    {goldItems.map((item, idx) => {
                      const netW = parseFloat(item.netWeight) || 0;
                      const rate = parseFloat(item.rate) || 0;
                      const purityMult = item.purity ? (item.purity.includes('%') ? parseFloat(item.purity)/100 : (item.purity.includes('K') ? parseFloat(item.purity)/24 : 1)) : 1;
                      const effRate = rate * purityMult;
                      return (
                        <div key={`g-${idx}`} className={`grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] ${isCrowded ? 'py-[0px]' : 'py-[5px]'} px-3 items-center`}>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 uppercase`}>{item.category} ({item.purity})</div>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.grossWeight || item.netWeight} g</div>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.netWeight} g</div>
                          <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{formatINR(rate).replace('₹', '').trim()}</div>
                          <div className={`${isCrowded ? 'text-[10px]' : 'text-[11.5px]'} font-extrabold text-black text-right`}>{formatINR(netW * effRate).replace('₹', '').trim()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-0 pb-0 shrink-0">
              <div className="bg-[#F8F9FA] px-4 py-1 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between py-0.5 text-[11px] font-bold text-black border-b border-gray-200 pb-0.5 mb-1">
                  <span className="font-nirand uppercase tracking-wide text-gray-500">TOTAL AMOUNT</span>
                  <span className="font-extrabold">{formatINR(data.metalValue)}</span>
                </div>
                <div className="space-y-1">
                  {parseFloat(data.silverMakingCharges) > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="font-nirand text-gray-600 font-semibold">Silver Making Charges</span>
                      <span className="font-bold text-black">{formatINR(data.silverMakingCharges)}</span>
                    </div>
                  )}
                  {parseFloat(data.goldMakingCharges) > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="font-nirand text-gray-600 font-semibold">Gold Making & Hallmarking</span>
                      <span className="font-bold text-black">{formatINR(data.goldMakingCharges)}</span>
                    </div>
                  )}
                  {parseFloat(data.discount) > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="font-nirand text-gray-600 font-semibold">Discount</span>
                      <span className="font-bold text-green-600">-{formatINR(data.discount)}</span>
                    </div>
                  )}
                  {data.gstAmount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="font-nirand text-gray-600 font-semibold">GST (3%)</span>
                      <span className="font-bold text-black">{formatINR(data.gstAmount)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-300">
                  <span className="font-nirand font-bold text-[13px] tracking-wide text-gray-500 uppercase">SUB TOTAL</span>
                  <span className="font-extrabold text-[13px] text-gray-600">{formatINR(data.grandTotal)}</span>
                </div>
                {data.linkedAdvanceAmount > 0 && (
                  <div className="flex justify-between items-center pt-1 mt-1 border-t border-dashed border-gray-300">
                    <span className="font-nirand font-medium text-[11px] tracking-wide text-gray-600">Advance ({data.linkedAdvanceDate})</span>
                    <span className="font-extrabold text-[12px] text-gray-700">-{formatINR(data.linkedAdvanceAmount)}</span>
                  </div>
                )}
                {data.creditAmount > 0 && (
                  <div className="flex justify-between items-center pt-1 mt-1 border-t border-dashed border-gray-300">
                    <span className="font-nirand font-medium text-[11px] tracking-wide text-amber-600">Credit Financing</span>
                    <span className="font-extrabold text-[12px] text-amber-600">-{formatINR(data.creditAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t-2 border-[#1B1464]">
                  <span className="font-nirand font-bold text-[14px] tracking-wide text-[#1B1464] uppercase">{data.creditAmount > 0 ? 'FINAL PAID' : 'FINAL DUE'}</span>
                  <span className="font-extrabold text-[15px] text-[#1B1464]">{formatINR(data.finalPaid !== undefined ? data.finalPaid : (data.finalDue !== undefined ? data.finalDue : data.grandTotal))}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg py-1 px-5 bg-white flex justify-between items-center mt-1">
                <div className="text-[11px] flex items-center gap-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Gross Total:</span> 
                  <span className="font-extrabold text-gray-500 line-through">{formatINR(data.grandTotal)} /-</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-[12px] flex items-center gap-2 text-[#1B1464]">
                  <span className="font-bold uppercase tracking-wider">Final Paid:</span> 
                  <span className="font-extrabold">{formatINR(data.finalPaid !== undefined ? data.finalPaid : (data.finalDue !== undefined ? data.finalDue : data.grandTotal))} /-</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================= */}
        {/* RIGHT COLUMN: THE BIG IMAGES            */}
        {/* ======================================= */}
        <div className="w-[520px] h-full flex flex-col p-8 items-center justify-start bg-white relative">
          
          {/* Faded Aarthika Logo in Background of Right Col */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
            <img src={premiumLogo} alt="Logo" className="w-[60%] object-contain grayscale" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center h-full">
            <div className="text-center w-full mb-8 pt-4">
              <h2 className="text-[26px] font-black text-[#1B1464] font-nirand tracking-widest uppercase">Vault Verification</h2>
              <p className="text-[11px] font-bold text-gray-500 tracking-[0.2em] mt-1">INTERNAL SECURITY RECORD</p>
              <div className="w-[100px] h-[3px] bg-amber-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="flex w-full justify-between gap-6 px-4 flex-grow items-center">
              
              {/* Customer Photo Box */}
              <div className="flex flex-col items-center w-1/2">
                <div className="text-[13px] font-extrabold text-[#1B1464] uppercase tracking-widest mb-3">Customer Identity</div>
                <div className="w-[200px] h-[200px] bg-gray-50 border-[3px] border-[#1B1464] p-1.5 rounded-2xl shadow-xl bg-white overflow-hidden flex items-center justify-center relative">
                  {data.customerPhoto ? (
                    <img src={data.customerPhoto} alt="Customer" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400">NO PHOTO</span>
                  )}
                  <div className="absolute bottom-0 right-0 bg-[#1B1464] text-white text-[9px] font-bold px-2 py-0.5 rounded-tl-lg">VERIFIED</div>
                </div>
                <div className="mt-4 text-[12px] font-bold text-gray-800 px-4 text-center">
                  {data.customerName || 'Customer'}
                </div>
              </div>

              {/* Jewellery Photo Box */}
              <div className="flex flex-col items-center w-1/2">
                <div className="text-[13px] font-extrabold text-[#1B1464] uppercase tracking-widest mb-3">Jewellery Item</div>
                <div className="w-[200px] h-[200px] bg-gray-50 border-[3px] border-[#1B1464] p-1.5 rounded-2xl shadow-xl bg-white overflow-hidden flex items-center justify-center relative">
                  {data.jewelleryPhoto ? (
                    <img src={data.jewelleryPhoto} alt="Jewellery" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400">NO PHOTO</span>
                  )}
                  <div className="absolute bottom-0 right-0 bg-[#1B1464] text-white text-[9px] font-bold px-2 py-0.5 rounded-tl-lg">SECURED</div>
                </div>
                <div className="mt-4 text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                  {totalItemsCount} ITEMS
                </div>
              </div>

            </div>
            
            <div className="w-full mt-auto pb-4">
              <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl text-center shadow-sm mx-4">
                <h3 className="text-[11px] font-extrabold text-[#1B1464] uppercase tracking-widest mb-1">Authenticity & Ownership Declaration</h3>
                <p className="text-[9px] text-gray-600 font-medium leading-relaxed">
                  By accepting this invoice, the customer confirms the purchase of the listed jewellery. The images captured above represent the verified customer and the precise condition of the jewellery at the time of sale. This document is automatically generated for internal vault records and security audits.
                </p>
              </div>
            </div>
            
          </div>
        </div>

      </div>
      
      {/* ======================================= */}
      {/* BOTTOM BELT: HAMARA BILL + FOOTER       */}
      {/* ======================================= */}
      <div className="w-full flex flex-col shrink-0 z-20">
        <div className="text-center py-2 text-[16px] text-gray-800 font-nirand tracking-wide font-medium bg-white">
          Hamara bill, Hamari Zimmedaari.
        </div>
        
        <div className="bg-[#1B1464] w-full text-white px-8 py-2 flex justify-between items-center h-[32px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-widest text-gray-300">Contact :</span>
            <span className="text-[10px] text-white">info@aarthikafinance.com | 0203 68541</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <img src={premiumLogo} alt="aarthika" className="h-3 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-[10px] text-white">www.aarthikafinance.com</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
