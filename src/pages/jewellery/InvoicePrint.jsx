import React, { useEffect, useState } from 'react';
import premiumLogo from '../../assets/3.png';
import qrCodeImage from '../../assets/qr-code.jpeg';
import watermarkImg from '../../assets/watermark.png';
import aarthikaLogo from '../../assets/Aarthika (1).png';

import html2pdf from 'html2pdf.js';

export default function InvoicePrint() {
  const [data, setData] = useState(null);
  const [isMobileEngine, setIsMobileEngine] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: 'State Bank Of India',
    accountNumber: '43017839721',
    ifsc: 'S B I N 0 0 0 0 1 1 7',
    upiId: 'shriyanshumishrakne-1@oksbi'
  });

  useEffect(() => {
    document.body.classList.add('printing-a5');
    setIsMobileEngine(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    return () => {
      document.body.classList.remove('printing-a5');
    };
  }, []);

  useEffect(() => {
    const rawData = localStorage.getItem('aarthika_current_invoice');
    if (rawData) {
      setData(JSON.parse(rawData));
    }
    const savedBank = localStorage.getItem('aarthika_bank_settings');
    if (savedBank) {
      setBankDetails(JSON.parse(savedBank));
    }
  }, []);

  useEffect(() => {
    // Automatically trigger print when rendered ONLY for PC.
    // Mobile browsers heavily block auto-downloads, so we let mobile users press the button.
    if (!isMobileEngine) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isMobileEngine]);

  const handlePrint = () => {
    if (isMobileEngine) {
      const element = document.getElementById('actual-receipt-content');
      const opt = {
        margin:       0,
        filename:     `A5-Invoice-${data.invoiceNumber || 'receipt'}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 3, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        // Manually dispatch afterprint so the terminal resets and goes back to checkout
        window.dispatchEvent(new Event('afterprint'));
      });
    } else {
      window.print();
    }
  };

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No invoice data found in session.</div>;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const silverItems = data.items?.filter(i => i.metalType === 'Silver') || [];
  const goldItems = data.items?.filter(i => i.metalType === 'Gold') || []; 
  const totalItemsCount = silverItems.length + goldItems.length;
  const isCrowded = totalItemsCount > 8;
  
  return (
    <div className="bg-[#F8F9FA] text-black w-full min-h-screen print:min-h-0 relative flex print:block items-center justify-center print:p-0 print:m-0" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;800&display=swap');
          
          @media print {
            @page {
              size: A5 portrait;
              margin: 5mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              overflow-x: visible !important;
            }
            ::-webkit-scrollbar { display: none !important; }
            body * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .no-print { display: none !important; }
            
            body, html { 
              background: white !important; 
              height: 100% !important;
            }
            
            .print-container, .print-container * {
              visibility: visible !important;
            }
            
            .print-container {
              position: relative !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              width: 100% !important;
              height: 200mm !important;
              page-break-after: always !important;
              overflow: visible !important;
            }
            
            @media (max-width: 768px) {
              /* Mobile Chrome completely ignores this if the paper size is Letter. Do not use. */
            }
            
            .mobile-print-override {
              position: static !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              transform: none !important;
            }
          }
          
          .font-nirand { font-family: "Nirand", "Red Hat Display", sans-serif; }
          .font-redhat { font-family: "Red Hat Display", sans-serif; }
        `}
      </style>

      {/* Control Panel - hidden during print */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
        <div className="text-sm font-semibold tracking-wide">Receipt Preview</div>
        <button 
          onClick={handlePrint} 
          className="bg-[#1B1464] hover:bg-[#2d22a0] text-white px-8 py-2.5 rounded text-sm font-bold tracking-widest uppercase shadow-lg transition-all"
        >
          PRINT / SAVE AS PDF
        </button>
      </div>

      {/* Invoice Canvas */}
      <div id="actual-receipt-content" className={`print-container w-[520px] h-[720px] bg-white pt-1 relative flex flex-col shadow-2xl print:shadow-none my-12 print:my-0 mx-auto print:mx-0 overflow-hidden box-border ${isMobileEngine ? 'mobile-print-override' : ''}`}>
        
        {/* Massive Watermark Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0 print:hidden">
          <img src={watermarkImg} alt="Watermark" className="w-[80%] object-contain grayscale" />
        </div>

        {/* Content Wrapper */}
        <div className="px-5 flex-grow flex flex-col relative z-10 justify-between min-h-0">
          
          {/* TOP STRIP */}
          <div className="flex justify-between items-center py-2 border-b-[2px] border-gray-300">
            
            {/* Column 1: Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-[28px] font-normal tracking-wide font-redhat leading-none whitespace-nowrap" style={{ color: '#1B1464' }}>
                MISHRA JEWELER'S
              </h1>
              <p className="text-[10px] font-bold tracking-[0.1em] mt-1 uppercase whitespace-nowrap" style={{ color: '#1B1464', fontFamily: '"Arial Nova", Arial, sans-serif' }}>
                GOLD & SILVER
              </p>
            </div>

            {/* Column 2: Contact Info */}
            <div className="flex flex-col gap-1 border-l-[2px] border-black pl-4 py-1 ml-6 text-right" style={{ color: '#1B1464', fontFamily: '"Arial Nova", Arial, sans-serif' }}>
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

          {/* MAIN CONTENT AREA (Single Column) */}
          <div className="flex flex-col mt-4 flex-grow min-h-0 w-full h-full">
              
              {/* Meta Info Row */}
              <div className="flex justify-between items-start mb-2 shrink-0">
                {/* INVOICE */}
                <div>
                  <h2 className="text-[28px] mb-2 font-normal font-nirand leading-none tracking-wide" style={{ color: '#1B1464' }}>INVOICE</h2>
                  <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1.5 text-[12px] font-bold text-gray-700" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
                    <span>Invoice date:</span>
                    <span className="text-black font-normal">{data.date}</span>
                    <span>Invoice Number:</span>
                    <span className="text-black font-normal uppercase">{data.invoiceNo}</span>
                  </div>
                </div>
                
                {/* INVOICE TO */}
                <div className="flex flex-col items-center pt-2">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest text-center">INVOICE TO</div>
                  <div className="text-[14px] font-bold text-gray-800 tracking-wide uppercase text-center">{data.customerName || 'Customer'}</div>
                  <div className="text-[12px] text-gray-500 font-bold leading-relaxed space-y-1.5">+91-{data.customerPhone}</div>
                  {data.customerVillage && <div className="text-[11px] text-gray-500 font-bold mt-0.5 text-center">{data.customerVillage}</div>}
                </div>
              </div>

              {/* Table */}
              <div className="w-full mb-1 border border-gray-200 flex flex-col flex-grow min-h-0">
                {/* Table Header */}
                <div className="grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] bg-[#F8F9FA] py-1 px-3 border-b border-gray-200">
                  <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand">Descriptions</div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Gross Weight</div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Net Weight</div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-center">Rate ₹</div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase font-nirand text-right">Amount ₹</div>
                </div>
                
                {/* Table Body */}
                <div className="flex flex-col flex-grow bg-white pb-2">
                  {/* Silver Section */}
                  {silverItems.length > 0 && (
                    <div className={isCrowded ? "mb-1" : "mb-2"}>
                      <div className={`text-[11px] font-bold text-[#1B1464] uppercase px-3 ${isCrowded ? 'pt-1 pb-0' : 'pt-2 pb-0.5'} font-nirand tracking-widest`}>SILVER</div>
                      {silverItems.map((item, idx) => {
                        const netW = parseFloat(item.netWeight) || 0;
                        const rate = parseFloat(item.rate) || 0;
                        const purityMult = item.purity ? (item.purity.includes('%') ? parseFloat(item.purity)/100 : (item.purity.includes('K') ? parseFloat(item.purity)/24 : 1)) : 1;
                        const effRate = rate * purityMult;
                        return (
                          <div key={`s-${idx}`} className={`grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] ${isCrowded ? 'py-[1px]' : 'py-[5px]'} px-3 items-center`}>
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

                  {/* Gold Section */}
                  {goldItems.length > 0 && (
                    <div className={isCrowded ? "mb-0" : "mb-1"}>
                      <div className={`text-[11px] font-bold text-[#1B1464] uppercase px-3 ${isCrowded ? 'pt-1 pb-0' : 'pt-2 pb-0.5'} font-nirand tracking-widest`}>GOLD</div>
                      {goldItems.map((item, idx) => {
                        const netW = parseFloat(item.netWeight) || 0;
                        const rate = parseFloat(item.rate) || 0;
                        const purityMult = item.purity ? (item.purity.includes('%') ? parseFloat(item.purity)/100 : (item.purity.includes('K') ? parseFloat(item.purity)/24 : 1)) : 1;
                        const effRate = rate * purityMult;
                        return (
                          <div key={`g-${idx}`} className={`grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] ${isCrowded ? 'py-[1px]' : 'py-[5px]'} px-3 items-center`}>
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

              {/* Totals Section (Left Side) */}
              <div className="mt-0 pb-1 shrink-0">
                <div className="bg-[#F8F9FA] px-4 py-1 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between py-0.5 text-[11px] font-bold text-black border-b border-gray-200 pb-0.5 mb-1">
                    <span className="font-nirand uppercase tracking-wide text-gray-500">TOTAL AMOUNT</span>
                    <span className="font-extrabold">{formatINR(data.metalValue)}</span>
                  </div>
                  
                  <div className="space-y-0.5">
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
                    <div className="flex justify-between items-center pt-0.5 mt-0.5 border-t border-dashed border-gray-300">
                      <span className="font-nirand font-medium text-[10px] tracking-wide text-gray-600">Advance ({data.linkedAdvanceDate})</span>
                      <span className="font-extrabold text-[11px] text-gray-700">-{formatINR(data.linkedAdvanceAmount)}</span>
                    </div>
                  )}
                  {data.creditAmount > 0 && (
                    <div className="flex justify-between items-center pt-0.5 mt-0.5 border-t border-dashed border-gray-300">
                      <span className="font-nirand font-medium text-[10px] tracking-wide text-amber-600">Credit Financing</span>
                      <span className="font-extrabold text-[11px] text-amber-600">-{formatINR(data.creditAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 mt-1 border-t-2 border-[#1B1464]">
                    <span className="font-nirand font-bold text-[14px] tracking-wide text-[#1B1464] uppercase">{data.creditAmount > 0 ? 'FINAL PAID' : 'FINAL DUE'}</span>
                    <span className="font-extrabold text-[15px] text-[#1B1464]">{formatINR(data.finalPaid !== undefined ? data.finalPaid : (data.finalDue !== undefined ? data.finalDue : data.grandTotal))}</span>
                  </div>
                </div>

                {/* Payment Tracking */}
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
          
          <div className="text-center mt-2 text-[16px] text-gray-800 font-nirand tracking-wide font-medium">
            Hamara bill, Hamari Zimmedaari.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1B1464] w-full text-white px-5 py-2 flex justify-between items-center z-10 relative h-[32px] shrink-0 mt-auto" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium tracking-widest text-gray-300">Contact :</span>
            <span className="text-[9px] text-white">info@aarthikafinance.com | 0203 68541</span>
          </div>
          
          <div className="flex items-center justify-end gap-2">
            <img src={premiumLogo} alt="aarthika" className="h-3 object-contain print:hidden" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-[9px] text-white">www.aarthikafinance.com</span>
          </div>
        </div>
      </div>

      {/* PAGE 2: CREDIT AGREEMENT (Only shown if credit is enabled) */}
      {data.creditAmount > 0 && (
        <div className={`print-container w-[520px] h-[720px] bg-white pt-6 px-8 relative flex flex-col shadow-2xl print:shadow-none mx-auto print:mx-0 overflow-hidden box-border ${isMobileEngine ? 'mobile-print-override' : ''}`}>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0 print:hidden">
            <img src={watermarkImg} alt="Watermark" className="w-[80%] object-contain grayscale" />
          </div>

          <div className="relative z-10 w-full flex flex-col h-full">
            <h2 className="text-xl font-black font-redhat text-[#1B1464] tracking-tight uppercase mb-1 text-center">Credit Financing Agreement</h2>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase text-center mb-4 pb-2 border-b-2 border-gray-200">Invoice: {data.invoiceNo} • {data.date}</p>

            <h3 className="text-xs font-extrabold tracking-widest text-[#1B1464] uppercase mb-2">Identity & Biometric Verification</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2 text-[10px]">
                <div className="flex bg-gray-50 p-1.5 rounded border border-gray-200"><strong className="w-20 text-gray-500">Name:</strong> <span>{data.customerName}</span></div>
                <div className="flex bg-gray-50 p-1.5 rounded border border-gray-200"><strong className="w-20 text-gray-500">Phone:</strong> <span>+91-{data.customerPhone}</span></div>
                <div className="flex bg-gray-50 p-1.5 rounded border border-gray-200"><strong className="w-20 text-gray-500">Vector:</strong> <span className="text-[7px] font-mono leading-tight break-all text-gray-600">{data.faceVectorStr ? (data.faceVectorStr.substring(0, 50) + '... [Secured]') : 'Not Extracted'}</span></div>
              </div>
              <div className="flex gap-2">
                <div className="w-1/2 flex flex-col items-center">
                  <div className="w-full aspect-square border border-gray-300 p-0.5 rounded shadow-sm bg-white mb-1">
                    {data.customerPhoto ? <img src={data.customerPhoto} className="w-full h-full object-cover rounded-sm" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">NO PHOTO</div>}
                  </div>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Live Photo</span>
                </div>
                <div className="w-1/2 flex flex-col items-center">
                  <div className="w-full aspect-square border border-gray-300 p-0.5 rounded shadow-sm bg-white mb-1">
                    {data.govtIdPhoto ? <img src={data.govtIdPhoto} className="w-full h-full object-cover rounded-sm" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">NO ID</div>}
                  </div>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Govt ID</span>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-extrabold tracking-widest text-[#1B1464] uppercase mb-2">Terms & Conditions</h3>
            <div className="text-[9px] text-gray-700 leading-relaxed space-y-1.5 mb-2 text-justify border border-gray-200 bg-gray-50 p-3 rounded-lg">
              <p><strong>1. ACKNOWLEDGMENT:</strong> The Customer acknowledges taking possession of the specified jewellery on {data.date} with a Credit Financed amount of <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.creditAmount)}</strong>.</p>
              <p><strong>2. TIMELINE & OBLIGATION:</strong> The Customer agrees to repay the full Credit Financed amount within <strong>30 days</strong>. Failure to repay will result in standard legal recovery.</p>
              <p><strong>3. INTEREST PENALTY:</strong> If unpaid within the timeline, a penalty interest rate of <strong>2% per month</strong> will be levied on the outstanding balance.</p>
              <p><strong>4. BIOMETRIC CONSENT:</strong> The Customer consents to the secure extraction (512D Vector mapping) and storage of their live photograph, Govt ID, and Signature for anti-fraud purposes.</p>
              <p><strong>5. OWNERSHIP:</strong> Legal title remains with Aarthika / Mishra Jeweler's until the outstanding credit balance is fully settled.</p>
            </div>

            <div className="flex-grow"></div>

            <div className="text-[10px] font-bold text-black border-t-2 border-gray-800 pt-2 mb-8 text-center px-4">
              I acknowledge that these terms were fully read, explained to me in my vernacular language, and I accept all conditions voluntarily.
            </div>

            <div className="flex justify-between items-end mt-2">
              <div className="flex flex-col items-center w-32">
                <div className="h-12 w-full border-b border-gray-400 flex items-center justify-center mb-1"></div>
                <span className="text-[9px] font-bold text-gray-800 uppercase tracking-widest">Authorized</span>
              </div>
              
              <div className="flex flex-col items-center w-32">
                <div className="h-12 w-full border-b border-gray-400 flex items-end justify-center mb-1">
                   {data.signaturePhoto ? (
                     <img src={data.signaturePhoto} alt="Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                   ) : (
                     <span className="text-gray-300 text-[8px] italic">Not Signed</span>
                   )}
                </div>
                <span className="text-[9px] font-bold text-gray-800 uppercase tracking-widest">Customer Sign</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
