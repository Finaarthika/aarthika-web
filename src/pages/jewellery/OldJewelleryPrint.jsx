import React, { useEffect, useState } from 'react';
import html2pdf from 'html2pdf.js';
import premiumLogo from '../../assets/3.png';
import watermarkImg from '../../assets/watermark.png';
import aarthikaLogo from '../../assets/Aarthika (1).png';

export default function OldJewelleryPrint() {
  const [data, setData] = useState(null);
  const [isMobileEngine, setIsMobileEngine] = useState(false);

  useEffect(() => {
    document.body.classList.add('printing-a5');
    setIsMobileEngine(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    return () => { document.body.classList.remove('printing-a5'); };
  }, []);

  useEffect(() => {
    const rawData = localStorage.getItem('aarthika_old_invoice');
    if (rawData) { setData(JSON.parse(rawData)); }
  }, []);

  useEffect(() => {
    if (!isMobileEngine && data) {
      const timer = setTimeout(() => { window.print(); }, 800);
      return () => clearTimeout(timer);
    }
  }, [isMobileEngine, data]);

  const handlePrint = () => {
    if (isMobileEngine) {
      const element = document.getElementById('actual-receipt-content');
      const opt = {
        margin: 0,
        filename: `OldJewellery-Purchase-${data?.invoiceNo || 'receipt'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        window.dispatchEvent(new Event('afterprint'));
      });
    } else {
      window.print();
    }
  };

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No purchase data found in session.</div>;

  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const purchasedItems = data.purchasedItems || [];
  const goldItems = purchasedItems.filter(i => i.metalType !== 'Silver');
  const silverItems = purchasedItems.filter(i => i.metalType === 'Silver');
  const isCrowded = purchasedItems.length > 6;

  const goldWeight = data.goldWeight || goldItems.reduce((a, i) => a + (Number(i.weight) || 0), 0);
  const silverWeight = data.silverWeight || silverItems.reduce((a, i) => a + (Number(i.weight) || 0), 0);
  const goldRate = data.goldScrapRate || 0;
  const silverRate = data.silverScrapRate || 0;

  return (
    <div className="bg-[#F8F9FA] text-black w-full min-h-screen print:min-h-0 relative flex print:block items-center justify-center print:p-0 print:m-0" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;800&display=swap');
        
        @media print {
          @page { size: A5 portrait; margin: 5mm; }
          html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; }
          ::-webkit-scrollbar { display: none !important; }
          body * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          body, html { background: white !important; height: 100% !important; }
          .print-container {
            position: relative !important; margin: 0 auto !important; padding: 0 !important;
            box-shadow: none !important; width: 100% !important; height: 200mm !important;
            page-break-after: always !important; overflow: visible !important;
          }
        }
        .font-nirand { font-family: "Red Hat Display", sans-serif; }
        .font-redhat { font-family: "Red Hat Display", sans-serif; }
      `}</style>

      {/* Screen Controls */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
        <div className="text-sm font-semibold tracking-wide">Old Purchase Receipt Preview</div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-rose-700 hover:bg-rose-600 text-white px-8 py-2.5 rounded text-sm font-bold tracking-widest uppercase shadow-lg transition-all">
            {isMobileEngine ? 'DOWNLOAD PDF' : 'PRINT / SAVE AS PDF'}
          </button>
          <button onClick={() => window.history.back()} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded text-sm font-bold">
            ← Back
          </button>
        </div>
      </div>

      {/* A5 Receipt Canvas */}
      <div id="actual-receipt-content" className="print-container w-[520px] min-h-[720px] bg-white pt-1 relative flex flex-col shadow-2xl print:shadow-none my-16 print:my-0 mx-auto overflow-hidden box-border">

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
          <img src={watermarkImg} alt="" className="w-[75%] object-contain grayscale" />
        </div>

        <div className="px-5 flex-grow flex flex-col relative z-10 justify-between min-h-0">

          {/* Header Strip */}
          <div className="flex justify-between items-center py-3 border-b-[2px] border-gray-300">
            <div className="flex-shrink-0">
              <h1 className="text-[26px] font-normal tracking-wide font-redhat leading-none whitespace-nowrap" style={{ color: '#7f1d1d' }}>
                MISHRA JEWELLER'S
              </h1>
              <p className="text-[10px] font-bold tracking-[0.12em] mt-1 uppercase whitespace-nowrap" style={{ color: '#7f1d1d' }}>
                OLD JEWELLERY PURCHASE RECEIPT
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 border-l-2 border-gray-300 pl-4 py-1 ml-4 text-right" style={{ color: '#7f1d1d' }}>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[10px] font-semibold">+91-6205168541</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </div>
              <div className="flex items-start justify-end gap-1.5">
                <span className="text-[9px] leading-tight font-semibold">Purani Gali, Kishanganj<br/>Bihar – 855107</span>
                <svg className="w-3 h-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>

          {/* Meta + Customer Row */}
          <div className="flex justify-between items-start mt-3 mb-2">
            <div>
              <h2 className="text-[24px] font-normal font-nirand leading-none tracking-wide mb-1.5" style={{ color: '#7f1d1d' }}>PURCHASE SLIP</h2>
              <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1 text-[11px] font-bold text-gray-700">
                <span>Date:</span><span className="font-normal text-black">{data.date}</span>
                <span>Invoice No:</span><span className="font-normal text-black uppercase">{data.invoiceNo}</span>
                <span>Officer:</span><span className="font-normal text-black">{data.officerName || '—'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest text-center">SOLD BY</div>
              <div className="text-[13px] font-bold text-gray-800 tracking-wide uppercase text-center leading-tight">{data.customerName}</div>
              <div className="text-[11px] text-gray-500 font-bold mt-0.5">+91-{data.customerPhone}</div>
              {data.customerVillage && <div className="text-[10px] text-gray-400 font-bold text-center">{data.customerVillage}</div>}
              {data.faceVectorStr && (
                <div className="mt-1 inline-block bg-rose-50 border border-rose-200 text-rose-700 text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ✓ Face Verified
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="w-full border border-gray-200 flex flex-col flex-grow min-h-0 mb-2">
            {/* Table Header */}
            <div className="grid grid-cols-[3fr_1fr_1fr_1.2fr] bg-[#fef2f2] py-1.5 px-3 border-b border-gray-200">
              <div className="text-[9px] font-bold text-gray-600 uppercase font-nirand">Item Description</div>
              <div className="text-[9px] font-bold text-gray-600 uppercase font-nirand text-center">Weight (g)</div>
              <div className="text-[9px] font-bold text-gray-600 uppercase font-nirand text-center">Purity (%)</div>
              <div className="text-[9px] font-bold text-gray-600 uppercase font-nirand text-right">Est. Value ₹</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col flex-grow bg-white">
              {/* Gold Items */}
              {goldItems.length > 0 && (
                <div className="mb-1">
                  <div className={`text-[10px] font-bold uppercase px-3 pt-1.5 pb-0 font-nirand tracking-widest`} style={{ color: '#92400e' }}>GOLD</div>
                  {goldItems.map((item, idx) => {
                    const w = Number(item.weight) || 0;
                    const p = Number(item.purity) || 0;
                    const val = w * goldRate * (p / 100);
                    return (
                      <div key={`g-${idx}`} className={`grid grid-cols-[3fr_1fr_1fr_1.2fr] ${isCrowded ? 'py-[2px]' : 'py-[4px]'} px-3 items-center border-b border-gray-50`}>
                        <div className={`${isCrowded ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-800`}>{item.name}</div>
                        <div className={`${isCrowded ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-700 text-center`}>{w}g</div>
                        <div className={`${isCrowded ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-700 text-center`}>{p}%</div>
                        <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-extrabold text-right`} style={{ color: '#92400e' }}>{formatINR(val).replace('₹','').trim()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Silver Items */}
              {silverItems.length > 0 && (
                <div className="mb-1">
                  <div className={`text-[10px] font-bold uppercase px-3 pt-1.5 pb-0 font-nirand tracking-widest`} style={{ color: '#374151' }}>SILVER</div>
                  {silverItems.map((item, idx) => {
                    const w = Number(item.weight) || 0;
                    const p = Number(item.purity) || 0;
                    const val = w * silverRate * (p / 100);
                    return (
                      <div key={`s-${idx}`} className={`grid grid-cols-[3fr_1fr_1fr_1.2fr] ${isCrowded ? 'py-[2px]' : 'py-[4px]'} px-3 items-center border-b border-gray-50`}>
                        <div className={`${isCrowded ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-800`}>{item.name}</div>
                        <div className={`${isCrowded ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-700 text-center`}>{w}g</div>
                        <div className={`${isCrowded ? 'text-[9px]' : 'text-[10px]'} font-bold text-gray-700 text-center`}>{p}%</div>
                        <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-extrabold text-center text-gray-600 text-right`}>{formatINR(val).replace('₹','').trim()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {purchasedItems.length === 0 && (
                <div className="p-3 text-[10px] text-gray-400 italic">{data.itemsDescription || '—'}</div>
              )}
            </div>
          </div>

          {/* Rates + Weights Summary */}
          <div className="bg-[#fef2f2] border border-rose-100 rounded-xl px-4 py-2 mb-3 shrink-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              {goldWeight > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase tracking-wide">Gold Weight</span>
                    <span className="font-extrabold text-gray-800">{Number(goldWeight).toFixed(2)} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase tracking-wide">Gold Scrap Rate</span>
                    <span className="font-extrabold" style={{ color: '#92400e' }}>₹{goldRate}/g</span>
                  </div>
                </>
              )}
              {silverWeight > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase tracking-wide">Silver Weight</span>
                    <span className="font-extrabold text-gray-800">{Number(silverWeight).toFixed(2)} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase tracking-wide">Silver Scrap Rate</span>
                    <span className="font-extrabold text-gray-600">₹{silverRate}/g</span>
                  </div>
                </>
              )}
              <div className="flex justify-between col-span-2 border-t border-rose-200 pt-1 mt-0.5">
                <span className="font-bold uppercase tracking-wide text-gray-500">Total Gross Weight</span>
                <span className="font-extrabold text-gray-800">{Number(data.grossWeight || 0).toFixed(2)} g</span>
              </div>
            </div>
          </div>

          {/* Totals Box */}
          <div className="bg-[#F8F9FA] px-4 py-2 rounded-xl border border-gray-200 shadow-sm shrink-0 mb-2">
            <div className="flex justify-between py-0.5 text-[11px] font-bold text-black border-b border-gray-200 pb-1 mb-1">
              <span className="font-nirand uppercase tracking-wide text-gray-500">Suggested Valuation</span>
              <span className="font-extrabold text-gray-700">{formatINR(data.suggestedValuation)}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5 border-t-2 mt-1" style={{ borderColor: '#7f1d1d' }}>
              <span className="font-nirand font-bold text-[14px] tracking-wide uppercase" style={{ color: '#7f1d1d' }}>FINAL AGREED VALUE</span>
              <span className="font-extrabold text-[16px]" style={{ color: '#7f1d1d' }}>{formatINR(data.finalValue)}</span>
            </div>
          </div>

          {/* Security Photos */}
          {(data.customerPhoto || data.jewelleryPhoto) && (
            <div className="grid grid-cols-2 gap-3 mb-2 shrink-0">
              <div className="flex flex-col items-center">
                <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vault: Customer Photo</div>
                <div className="w-full h-20 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {data.customerPhoto 
                    ? <img src={data.customerPhoto.startsWith('data:') ? data.customerPhoto : `data:image/jpeg;base64,${data.customerPhoto}`} className="w-full h-full object-cover" alt="Customer" />
                    : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">NO PHOTO</div>
                  }
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vault: Jewellery Photo</div>
                <div className="w-full h-20 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {data.jewelleryPhoto
                    ? <img src={data.jewelleryPhoto.startsWith('data:') ? data.jewelleryPhoto : `data:image/jpeg;base64,${data.jewelleryPhoto}`} className="w-full h-full object-cover" alt="Jewellery" />
                    : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">NO PHOTO</div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* Signature & Footer */}
          <div className="flex justify-between items-end pb-2 shrink-0">
            <div className="flex flex-col items-center w-28">
              <div className="border-b border-gray-400 w-full mb-1 h-8"></div>
              <p className="text-[7px] text-center font-bold text-gray-500 uppercase tracking-widest">Customer Signature</p>
            </div>
            <div className="text-center text-[8px] font-bold text-gray-500 uppercase tracking-widest">
              <p>Aarthika Security System</p>
              <p className="text-gray-400 font-normal">Ref: OP-{data.invoiceNo}</p>
            </div>
            <div className="flex flex-col items-center w-28">
              <div className="border-b border-gray-400 w-full mb-1 h-8"></div>
              <p className="text-[7px] text-center font-bold text-gray-500 uppercase tracking-widest">Authorized Sign</p>
            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div className="w-full text-white px-5 py-2 flex justify-between items-center z-10 relative h-8 shrink-0 mt-auto" style={{ background: '#7f1d1d' }}>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-medium tracking-widest text-red-200">Contact:</span>
            <span className="text-[8px] text-white">info@aarthikafinance.com</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={premiumLogo} alt="aarthika" className="h-3 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-[8px] text-white">www.aarthikafinance.com</span>
          </div>
        </div>

      </div>
    </div>
  );
}
