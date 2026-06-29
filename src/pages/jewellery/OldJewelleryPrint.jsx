import React, { useEffect, useState } from 'react';
import html2pdf from 'html2pdf.js';
import premiumLogo from '../../assets/3.png';
import watermarkImg from '../../assets/watermark.png';
import aarthikaLogo from '../../assets/Aarthika (1).png';

export default function OldJewelleryPrint({ dataProp, silentMode = false }) {
  const [data, setData] = useState(dataProp || null);
  const [isMobileEngine, setIsMobileEngine] = useState(false);

  useEffect(() => {
    if (!silentMode) {
      document.body.classList.add('printing-a4-land');
      setIsMobileEngine(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      return () => { document.body.classList.remove('printing-a4-land'); };
    }
  }, [silentMode]);

  useEffect(() => {
    if (!dataProp) {
      const rawData = localStorage.getItem('aarthika_old_invoice');
      if (rawData) { setData(JSON.parse(rawData)); }
    } else {
      setData(dataProp);
    }
  }, [dataProp]);

  useEffect(() => {
    if (!silentMode && !isMobileEngine && data && !dataProp) {
      const timer = setTimeout(() => { window.print(); }, 800);
      return () => clearTimeout(timer);
    }
  }, [isMobileEngine, data, silentMode, dataProp]);

  const handlePrint = () => {
    if (isMobileEngine) {
      const element = document.getElementById('actual-receipt-content');
      const opt = {
        margin: 0,
        filename: `OldJewellery-Purchase-${data?.invoiceNo || 'receipt'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
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
          @page { size: A4 landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; }
          ::-webkit-scrollbar { display: none !important; }
          body * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          body, html { background: white !important; }
          .print-container {
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; 
            transform: scale(1.05);
            transform-origin: top left;
            page-break-after: always !important; 
          }
        }
        .font-nirand { font-family: "Red Hat Display", sans-serif; }
        .font-redhat { font-family: "Red Hat Display", sans-serif; }
      `}</style>

      {/* Screen Controls */}
      {!silentMode && (
        <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
          <div className="text-sm font-semibold tracking-wide">Old Purchase Agreement (A4 Landscape)</div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="bg-rose-700 hover:bg-rose-600 text-white px-8 py-2.5 rounded text-sm font-bold tracking-widest uppercase shadow-lg transition-all">
              {isMobileEngine ? 'DOWNLOAD PDF' : 'PRINT / SAVE AS PDF'}
            </button>
            <button onClick={() => window.history.back()} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded text-sm font-bold">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* A4 Landscape Receipt Canvas */}
      <div id="actual-receipt-content" className="print-container w-[1050px] min-h-[720px] bg-white pt-1 relative flex flex-col shadow-2xl print:shadow-none my-20 print:my-0 mx-auto overflow-hidden box-border">

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
          <img src={watermarkImg} alt="" className="w-[50%] object-contain grayscale" />
        </div>

        <div className="px-6 flex-grow flex flex-col relative z-10 min-h-0">

          {/* Master Layout Grid */}
          <div className="flex flex-row gap-6 mt-2 mb-2 flex-grow">
            
            {/* LEFT COLUMN: Financials & Details (60%) */}
            <div className="w-[60%] flex flex-col border-r-2 border-gray-200 pr-6">
                
                {/* Header Strip */}
                <div className="flex justify-between items-center py-2 border-b-[2px] border-gray-300">
                  <div className="flex-shrink-0">
                    <h1 className="text-[28px] font-normal tracking-wide font-redhat leading-none whitespace-nowrap" style={{ color: '#7f1d1d' }}>
                      MISHRA JEWELLER'S
                    </h1>
                    <p className="text-[10px] font-bold tracking-[0.12em] mt-1.5 uppercase whitespace-nowrap" style={{ color: '#7f1d1d' }}>
                      OLD JEWELLERY PURCHASE AGREEMENT
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 border-l-2 border-gray-300 pl-4 py-1 ml-4 text-right" style={{ color: '#7f1d1d' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[11px] font-semibold">+91-6205168541</span>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    </div>
                    <div className="flex items-start justify-end gap-1.5">
                      <span className="text-[10px] leading-tight font-semibold">Dharampur, Uttar Dinajpur<br/>Pin Code : 733210</span>
                      <svg className="w-3.5 h-3.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                </div>

                {/* Meta + Customer Row */}
                <div className="flex justify-between items-start mt-2 mb-2">
                  <div>
                    <h2 className="text-[22px] font-normal font-nirand leading-none tracking-wide mb-1.5" style={{ color: '#7f1d1d' }}>PURCHASE DETAILS</h2>
                    <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 text-[12px] font-bold text-gray-700">
                      <span>Date:</span><span className="font-normal text-black">{data.date}</span>
                      <span>Invoice No:</span><span className="font-normal text-black uppercase">{data.invoiceNo}</span>
                      <span>Officer:</span><span className="font-normal text-black">{data.officerName || '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest text-center">SOLD BY</div>
                    <div className="text-[14px] font-bold text-gray-800 tracking-wide uppercase text-center leading-tight">{data.customerName}</div>
                    <div className="text-[12px] text-gray-500 font-bold mt-0.5">+91-{data.customerPhone}</div>
                    {data.customerVillage && <div className="text-[11px] text-gray-400 font-bold text-center mt-0.5">{data.customerVillage}</div>}
                  </div>
                </div>

                {/* Items Table */}
                <div className="w-full border border-gray-200 flex flex-col flex-grow min-h-0 mb-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-[3fr_1fr_1fr_1.2fr] bg-[#fef2f2] py-1.5 px-3 border-b border-gray-200">
                    <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand">Item Description</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Weight (g)</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Purity (%)</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-right">Est. Value ₹</div>
                  </div>

                  {/* Table Body */}
                  <div className="flex flex-col flex-grow bg-white">
                    {/* Gold Items */}
                    {goldItems.length > 0 && (
                      <div className="mb-0.5">
                        <div className={`text-[11px] font-bold uppercase px-3 pt-1.5 pb-0.5 font-nirand tracking-widest`} style={{ color: '#92400e' }}>GOLD</div>
                        {goldItems.map((item, idx) => {
                          const w = Number(item.weight) || 0;
                          const p = Number(item.purity) || 0;
                          const val = w * goldRate * (p / 100);
                          return (
                            <div key={`g-${idx}`} className={`grid grid-cols-[3fr_1fr_1fr_1.2fr] ${isCrowded ? 'py-0.5' : 'py-1'} px-3 items-center border-b border-gray-50`}>
                              <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-800`}>{item.name}</div>
                              <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-700 text-center`}>{w}g</div>
                              <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-700 text-center`}>{Number(p).toFixed(1)}%</div>
                              <div className={`${isCrowded ? 'text-[11px]' : 'text-[12px]'} font-extrabold text-right`} style={{ color: '#92400e' }}>{formatINR(val).replace('₹','').trim()}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Silver Items */}
                    {silverItems.length > 0 && (
                      <div className="mb-0.5">
                        <div className={`text-[11px] font-bold uppercase px-3 pt-1.5 pb-0.5 font-nirand tracking-widest`} style={{ color: '#374151' }}>SILVER</div>
                        {silverItems.map((item, idx) => {
                          const w = Number(item.weight) || 0;
                          const p = Number(item.purity) || 0;
                          const val = w * silverRate * (p / 100);
                          return (
                            <div key={`s-${idx}`} className={`grid grid-cols-[3fr_1fr_1fr_1.2fr] ${isCrowded ? 'py-0.5' : 'py-1'} px-3 items-center border-b border-gray-50`}>
                              <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-800`}>{item.name}</div>
                              <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-700 text-center`}>{w}g</div>
                              <div className={`${isCrowded ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-700 text-center`}>{Number(p).toFixed(1)}%</div>
                              <div className={`${isCrowded ? 'text-[11px]' : 'text-[12px]'} font-extrabold text-center text-gray-600 text-right`}>{formatINR(val).replace('₹','').trim()}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {purchasedItems.length === 0 && (
                      <div className="p-3 text-[11px] text-gray-400 italic">{data.itemsDescription || '—'}</div>
                    )}
                  </div>
                </div>

                {/* Rates + Weights Summary */}
                <div className="bg-[#fef2f2] border border-rose-100 rounded-xl px-4 py-1.5 mb-2 shrink-0">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
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
                    <div className="flex justify-between col-span-2 border-t border-rose-200 pt-1.5 mt-0.5">
                      <span className="font-bold uppercase tracking-wide text-gray-500">Total Gross Weight</span>
                      <span className="font-extrabold text-gray-800">{Number(data.grossWeight || 0).toFixed(2)} g</span>
                    </div>
                  </div>
                </div>

                {/* Totals Box */}
                <div className="bg-[#F8F9FA] px-5 py-2 rounded-xl border border-gray-200 shadow-sm shrink-0 mb-2">
                  <div className="flex justify-between py-0.5 text-[12px] font-bold text-black border-b border-gray-200 pb-1 mb-1">
                    <span className="font-nirand uppercase tracking-wide text-gray-500">Suggested Valuation</span>
                    <span className="font-extrabold text-gray-700">{formatINR(data.suggestedValuation)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t-2 mt-1.5" style={{ borderColor: '#7f1d1d' }}>
                    <span className="font-nirand font-bold text-[16px] tracking-wide uppercase" style={{ color: '#7f1d1d' }}>FINAL AGREED VALUE</span>
                    <span className="font-extrabold text-[18px]" style={{ color: '#7f1d1d' }}>{formatINR(data.finalValue)}</span>
                  </div>
                </div>

                {/* Authorized Sign for Left Side */}
                <div className="flex justify-between items-end mt-4 mb-1">
                   <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                    <p className="text-rose-700 mb-1">Aarthika Security System</p>
                    <p>Internal Ref: OP-{data.invoiceNo}</p>
                    <p>Generated at: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'})}</p>
                  </div>
                  <div className="flex flex-col items-center w-36">
                    <div className="border-b-2 border-gray-400 w-full mb-1.5 h-10"></div>
                    <p className="text-[9px] text-center font-bold text-gray-500 uppercase tracking-widest">Authorized Sign</p>
                  </div>
                </div>

            </div>

            {/* RIGHT COLUMN: Vault Photos & T&A (40%) */}
            <div className="w-[40%] flex flex-col justify-between pt-2">
              
              <div className="flex flex-col gap-4">
                  {/* Vault Security Photos */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                    <h3 className="text-[11px] font-black text-rose-700 tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Security Vault Evidence
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col items-center">
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Customer Verification</div>
                        <div className="w-full aspect-[4/3] border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
                          {data.customerPhoto 
                            ? <img src={data.customerPhoto.startsWith('data:') ? data.customerPhoto : `data:image/jpeg;base64,${data.customerPhoto}`} className="w-full h-full object-cover" alt="Customer" />
                            : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">NO PHOTO</div>
                          }
                        </div>
                        {data.faceVectorStr && (
                          <div className="mt-1.5 bg-green-50 text-green-700 border border-green-200 text-[7px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-full text-center">
                            Face Scan Matched
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Surrendered Item(s)</div>
                        <div className="w-full aspect-[4/3] border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
                          {data.jewelleryPhoto
                            ? <img src={data.jewelleryPhoto.startsWith('data:') ? data.jewelleryPhoto : `data:image/jpeg;base64,${data.jewelleryPhoto}`} className="w-full h-full object-cover" alt="Jewellery" />
                            : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">NO PHOTO</div>
                          }
                        </div>
                        <div className="mt-1.5 bg-gray-100 text-gray-500 border border-gray-200 text-[7px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-full text-center">
                            Item Assessment Captured
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Agreements */}
                  <div>
                    <h3 className="text-[11px] font-black text-rose-700 tracking-widest uppercase mb-2 border-b border-rose-200 pb-1">Terms & Conditions of Sale</h3>
                    <ol className="list-decimal list-outside ml-3 space-y-1.5 text-[8.5px] leading-snug text-gray-700 text-justify font-medium pr-1">
                      <li>I confirm I have sold the above-described ornaments to Aarthika for the stated amount and hereby transfer all my rights, title, and interest in the ornaments to Aarthika.</li>
                      <li>I am the rightful owner of these ornaments and have full authority to sell them. I have lawfully acquired these ornaments and have absolute ownership rights.</li>
                      <li>The ornaments are not stolen, pledged, mortgaged, or subject to any other claims, encumbrances, or legal proceedings.</li>
                      <li>I hereby grant Aarthika explicit permission to test the purity of the ornaments by any means necessary, including but not limited to melting, cutting, scraping, or acid testing.</li>
                      <li>I understand and consent that after purchase, Aarthika may melt, reshape, or otherwise alter these ornaments at their discretion without further notification to me.</li>
                      <li>I confirm the purity of the gold and silver as stated above and understand that Aarthika has accepted this based solely on my declaration. Any discrepancy found during testing may result in a revised valuation.</li>
                      <li>I do not possess any bills, receipts, or documentation proving the purchase or ownership of these ornaments, and I waive any future claims regarding the same.</li>
                      <li>I hereby indemnify Aarthika against any third-party claims of ownership, theft, or other legal disputes that may arise regarding these ornaments.</li>
                      <li>I understand that this sale is final and irrevocable, and I relinquish all future claims on the sold ornaments.</li>
                      <li>I understand that if any information provided by me is found to be false, I shall be solely responsible for all legal consequences, including criminal prosecution for fraud.</li>
                    </ol>
                  </div>
              </div>

              {/* Customer Signature Box at Bottom Right */}
              <div className="flex flex-col items-end justify-end mt-4">
                  <div className="flex flex-col items-center w-48 mt-8">
                    <div className="border-b-2 border-gray-800 w-full mb-1.5"></div>
                    <p className="text-[9px] text-center font-bold text-gray-800 uppercase tracking-widest">Seller's Signature / Thumb Impression</p>
                    <p className="text-[7.5px] text-center font-medium text-gray-500 mt-0.5 max-w-full leading-tight">I have read, understood, and agreed to the above terms and conditions.</p>
                  </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Bar */}
        <div className="w-full text-white px-6 py-2.5 flex justify-between items-center z-10 relative mt-auto h-10 shrink-0" style={{ background: '#7f1d1d' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-widest text-red-200 uppercase">Contact Support:</span>
            <span className="text-[10px] text-white font-bold tracking-wide">info@aarthikafinance.com</span>
          </div>
          <div className="flex items-center gap-3">
            <img src={premiumLogo} alt="aarthika" className="h-4 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-[10px] text-white font-bold tracking-widest uppercase">www.aarthikafinance.com</span>
          </div>
        </div>

      </div>
    </div>
  );
}
