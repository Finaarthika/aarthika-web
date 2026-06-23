import React, { useEffect, useState } from 'react';
import premiumLogo from '../../assets/3.png';
import qrCodeImage from '../../assets/qr-code.jpeg';
import watermarkImg from '../../assets/watermark.png';
import aarthikaLogo from '../../assets/Aarthika (1).png';

export default function InvoicePrint() {
  const [data, setData] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    bankName: 'State Bank Of India',
    accountNumber: '43017839721',
    ifsc: 'S B I N 0 0 0 0 1 1 7',
    upiId: 'shriyanshumishrakne-1@oksbi'
  });

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
    // Automatically trigger print when rendered
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No invoice data found in session.</div>;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const silverItems = data.items?.filter(i => i.metalType === 'Silver') || [];
  const goldItems = data.items?.filter(i => i.metalType === 'Gold') || []; 
  const totalItemsCount = silverItems.length + goldItems.length;
  const isCrowded = totalItemsCount > 4;
  
  return (
    <div className="bg-[#F8F9FA] text-black w-full min-h-screen print:min-h-0 relative flex print:block items-center justify-center print:p-0 print:m-0" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;800&display=swap');
          
          @media print {
            @page {
              size: A4 landscape;
              margin: 5mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
            ::-webkit-scrollbar { display: none !important; }
            body * { visibility: visible !important; }
            .no-print { display: none !important; }
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .print-container {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
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
          onClick={() => window.print()} 
          className="bg-[#1B1464] hover:bg-[#2d22a0] text-white px-8 py-2.5 rounded text-sm font-bold tracking-widest uppercase shadow-lg transition-all"
        >
          PRINT / SAVE AS PDF
        </button>
      </div>

      {/* Invoice Canvas */}
      <div id="actual-receipt-content" className="print-container w-[1123px] h-[720px] bg-white pt-1 relative flex flex-col shadow-2xl print:shadow-none my-24 print:my-0 mx-auto print:mx-0 overflow-hidden box-border">
        
        {/* Massive Watermark Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
          <img src={watermarkImg} alt="Watermark" className="w-[60%] object-contain grayscale" />
        </div>

        {/* Content Wrapper */}
        <div className="px-8 flex-grow flex flex-col relative z-10 justify-between min-h-0">
          
          {/* TOP STRIP */}
          <div className="flex justify-between items-center py-1 border-b-[2px] border-gray-300">
            
            {/* Column 1: Logo */}
            <div className="flex-shrink-0 pl-2">
              <h1 className="text-[42px] font-normal tracking-wide font-redhat leading-none whitespace-nowrap" style={{ color: '#1B1464' }}>
                MISHRA JEWELER'S
              </h1>
              <p className="text-[14px] font-normal tracking-[0.1em] mt-1 uppercase whitespace-nowrap" style={{ color: '#1B1464', fontFamily: '"Arial Nova", Arial, sans-serif' }}>
                GOLD & SILVER
              </p>
            </div>

            {/* Column 2: Contact Info */}
            <div className="flex items-center border-l-[3.5px] border-black pl-5 py-2 ml-8 mr-auto">
              <div className="flex flex-col gap-1.5" style={{ color: '#1B1464', fontFamily: '"Arial Nova", Arial, sans-serif' }}>
                <div className="flex items-center gap-2.5">
                  <svg className="w-[18px] h-[18px] text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                  </svg>
                  <span className="text-[13px] font-semibold">+91 - 6205168541</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="w-[20px] h-[20px] text-black mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-[11px] leading-snug font-semibold">
                    Dharampur & Daliganj, Uttar Dinajpur,<br/>
                    West Bengal<br/>
                    Pin Code : 733210
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Finance Partner */}
            <div className="flex justify-end items-center gap-4 pr-2 flex-shrink-0">
              <span className="text-[14px] tracking-[0.1em] font-normal" style={{ color: '#1B1464', fontFamily: '"Arial Nova", Arial, sans-serif' }}>FINANCE PARTNER</span>
              <img src={aarthikaLogo} alt="Aarthika" className="h-[55px] object-contain" />
            </div>

          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="flex gap-12 mt-6 px-2 flex-grow min-h-0">
            
            {/* LEFT AREA (50% width) */}
            <div className="w-[50%] flex flex-col pr-2 h-full">
              
              {/* Meta Info Row */}
              <div className="flex justify-between items-start mb-2 shrink-0">
                {/* INVOICE */}
                <div>
                  <h2 className="text-[40px] mb-3 font-normal font-nirand leading-none tracking-wide" style={{ color: '#1B1464' }}>INVOICE</h2>
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
              <div className="w-full mb-2 border border-gray-200 flex flex-col flex-grow min-h-0">
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
                        return (
                          <div key={`s-${idx}`} className={`grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] ${isCrowded ? 'py-[1px]' : 'py-[3px]'} px-3 items-center`}>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 uppercase`}>{item.category} ({item.purity})</div>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.grossWeight || item.netWeight} g</div>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.netWeight} g</div>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{formatINR(rate).replace('₹', '').trim()}</div>
                            <div className={`${isCrowded ? 'text-[10px]' : 'text-[11.5px]'} font-extrabold text-black text-right`}>{formatINR(netW * rate).replace('₹', '').trim()}</div>
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
                        return (
                          <div key={`g-${idx}`} className={`grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] ${isCrowded ? 'py-[1px]' : 'py-[3px]'} px-3 items-center`}>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 uppercase`}>{item.category} ({item.purity})</div>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.grossWeight || item.netWeight} g</div>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{item.netWeight} g</div>
                            <div className={`${isCrowded ? 'text-[9px]' : 'text-[10.5px]'} font-bold text-gray-800 text-center`}>{formatINR(rate).replace('₹', '').trim()}</div>
                            <div className={`${isCrowded ? 'text-[10px]' : 'text-[11.5px]'} font-extrabold text-black text-right`}>{formatINR(netW * rate).replace('₹', '').trim()}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Totals Section (Left Side) */}
              <div className="mt-0 pb-1 shrink-0">
                <div className="bg-[#F8F9FA] px-4 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between py-1 text-[12px] font-bold text-black border-b border-gray-200 pb-1 mb-1">
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
                  
                  <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-gray-300">
                    <span className="font-nirand font-bold text-[14px] tracking-wide text-[#1B1464] uppercase">GRAND TOTAL</span>
                    <span className="font-extrabold text-[16px] text-[#1B1464]">₹ {formatINR(data.grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Tracking */}
                <div className="border border-gray-200 rounded-lg py-1.5 px-5 bg-white flex justify-between items-center mt-1.5">
                  <div className="text-[11px] flex items-center gap-2">
                    <span className="text-gray-500 font-bold uppercase tracking-wider">Paid:</span> 
                    <span className="font-extrabold text-black">₹ {formatINR(data.grandTotal)} /-</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="text-[12px] flex items-center gap-2 text-[#1B1464]">
                    <span className="font-bold uppercase tracking-wider">Total Paid:</span> 
                    <span className="font-extrabold">₹ {formatINR(data.grandTotal)} /-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT AREA (50% width) */}
            <div className="w-[50%] flex flex-col pl-2 h-full">
              
              {/* Terms and Conditions */}
              <div className="text-[8.5px] text-gray-700 text-justify leading-snug mb-2 shrink-0">
                <div className="font-bold text-black mb-1.5 text-[13px] text-center tracking-wide" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>Terms and Conditions for Jewelry Sale</div>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Sale and Purchase Agreement: By purchasing jewelry from us, you agree to these terms and conditions. The sale is considered final once the purchase is completed, and no cancellations will be accepted post transaction.</li>
                  <li>Payment of Remaining Due Amount: Any remaining balance due on the purchased jewelry must be settled within the agreed payment period. Failure to do so may result in interest charges of 2% per month or cancellation of the order.</li>
                  <li>Exchange of Old Jewelry: Customers have the option to exchange old jewelry for new pieces. The value of the old jewelry will be assessed based on current market rates, considering factors such as metal weight and quality.</li>
                  <li>Subtraction of Charges Upon Sale: When reselling jewelry bought from us, deductions will be made for making charges, any impurities, and the value of stones. The final resale value will be calculated after these adjustments.</li>
                  <li>Future Exchange Conditions: Jewelry can be exchanged in the future under the condition that it remains in good condition. Any damage or significant wear may affect the resale or exchange value. Regular maintenance is advised to ensure the longevity and quality of the ornaments.</li>
                  <li>Custom Orders: We offer customization services to create unique pieces tailored to your preferences. A non-refundable deposit is required to initiate the design process, and the final price will depend on the materials and complexity of the design.</li>
                  <li>Privacy and Data Protection: We are committed to protecting your personal information. All data collected during transactions is securely stored and will not be shared with third parties without your consent, except as required by law.</li>
                  <li>Dispute Resolution: In the event of any disputes arising from these terms and conditions, we encourage resolving matters amicably through direct communication. If necessary, disputes will be settled under the jurisdiction of the courts in Uttar Dinajpur, West Bengal.</li>
                </ol>
              </div>

              {/* Bank Details & QR (Right Side) */}
              <div className="mt-auto flex flex-col px-2 pb-2 shrink-0">
                <div className="font-bold text-black mb-2 text-[13px] text-center tracking-wide" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>Payment Instructions</div>
                
                <div className="flex justify-between items-start">
                  {/* Bank Info */}
                  <div className="text-[10px] space-y-2 text-gray-800">
                    <div className="flex gap-2"><span className="text-gray-500 w-[100px]">Payment Method:</span> <span className="font-bold">Bank Transfer</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-[100px]">Bank Name:</span> <span className="font-bold">{bankDetails.bankName}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-[100px]">Account Number:</span> <span className="font-bold">{bankDetails.accountNumber}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-[100px]">IFSC:</span> <span className="font-bold tracking-widest">{bankDetails.ifsc}</span></div>
                  </div>
                  
                  {/* UPI Info & QR */}
                  <div className="text-[10px] flex flex-col items-end">
                    <div className="flex gap-2 justify-end mb-2"><span className="text-gray-500">Payment Method:</span> <span className="font-bold">UPI</span></div>
                    <div className="flex gap-2 justify-end mb-4"><span className="text-gray-500">UPI ID:</span> <span className="font-bold">{bankDetails.upiId}</span></div>
                    
                    <div className="text-center">
                      <div className="bg-white p-1 rounded-xl border border-gray-200 mb-1 inline-block shadow-sm">
                        <img src={qrCodeImage} alt="QR Code" className="w-[65px] h-[65px] object-cover rounded-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-2 text-[16px] text-gray-800 font-nirand tracking-wide font-medium">
            Hamara bill, Hamari Zimmedaari.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1B1464] w-full text-white px-8 py-1.5 flex justify-between items-center z-10 relative h-[32px] shrink-0 mt-auto" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-widest text-gray-300">Contact :</span>
            <span className="text-[11px] text-white">info@aarthikafinance.com | 0203 68541</span>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <img src={premiumLogo} alt="aarthika" className="h-4 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-[11px] text-white">www.aarthikafinance.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
