import React, { useEffect, useState } from 'react';
import premiumLogo from '../../assets/3.png';
import qrCodeImage from '../../assets/qr-code.jpeg';
import watermarkImg from '../../assets/watermark.png';

export default function InvoicePrint() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const rawData = sessionStorage.getItem('aarthika_current_invoice');
    if (rawData) {
      setData(JSON.parse(rawData));
      setTimeout(() => {
        window.print();
      }, 1500);
    }
  }, []);

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No invoice data found in session.</div>;

  const formatINR = (amount) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="bg-[#F8F9FA] text-black w-full min-h-screen relative flex items-center justify-center" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;800&display=swap');
          
          @media print {
            @page { size: A4 landscape; margin: 0; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background-color: white !important; 
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print { display: none !important; }
            .print-container { 
              padding: 0 !important; 
              margin: 0 !important; 
              width: 100% !important; 
              max-width: none !important;
              box-shadow: none !important;
            }
          }
          
          .font-nirand { font-family: "Nirand", "Red Hat Display", sans-serif; }
          .font-redhat { font-family: "Red Hat Display", sans-serif; }
        `}
      </style>

      {/* Control Panel (Hidden during print) */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
        <div className="text-sm font-semibold tracking-wide">Ultra-Premium Native PDF Engine</div>
        <button onClick={() => window.print()} className="bg-[#3A2E8A] hover:bg-[#2b2266] px-5 py-2.5 rounded text-sm font-bold tracking-widest uppercase shadow-lg transition-all">
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Canvas */}
      <div className="print-container w-[1123px] bg-white pt-12 relative min-h-[794px] flex flex-col overflow-hidden shadow-2xl no-print:my-20">
        
        {/* Massive Watermark Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
          <img src={watermarkImg} alt="Watermark" className="w-[85%] object-contain grayscale" />
        </div>

        {/* Content Wrapper */}
        <div className="px-16 flex-grow flex flex-col relative z-10">
          
          {/* Header: Logo & Address */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h1 className="text-[38px] font-extrabold tracking-wider font-redhat text-[#3A2E8A] leading-none">MISHRA JEWELER'S</h1>
              <p className="text-[13px] font-bold tracking-[0.2em] mt-1.5 font-nirand text-[#3A2E8A]">GOLD & SILVER</p>
            </div>
            <div className="text-[12px] text-gray-700 text-right space-y-1">
              <div className="flex items-center justify-end gap-2 font-bold text-black">
                <svg className="w-3.5 h-3.5 text-[#3A2E8A]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                <span>+91-06205168541</span>
              </div>
              <div className="flex items-start justify-end gap-2 text-right">
                <svg className="w-3.5 h-3.5 text-[#3A2E8A] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                <span>Dharampur & Daliganj, Uttar Dinajpur,<br/>West Bengal, Pin Code : 733210</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t-[1.5px] border-gray-200 mb-8"></div>

          {/* Title & Meta Info */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-[46px] font-bold text-black mb-4 uppercase font-nirand leading-none tracking-tight">INVOICE</h2>
              <div className="grid grid-cols-[105px_1fr] gap-x-4 gap-y-1.5 text-[13px] text-black">
                <span className="font-bold font-nirand text-gray-500 uppercase tracking-wide">Invoice date:</span>
                <span className="font-bold">{data.date}</span>
                <span className="font-bold font-nirand text-gray-500 uppercase tracking-wide">Invoice Number:</span>
                <span className="font-bold">{data.invoiceNo}</span>
              </div>
            </div>
            
            {/* INVOICE TO - Perfectly aligned to hover over the Amount column */}
            <div className="text-right w-[320px]">
              <div className="text-[12px] font-bold text-[#3A2E8A] tracking-widest mb-2 uppercase font-nirand">INVOICE TO</div>
              <div className="text-[18px] font-bold text-black uppercase tracking-wide">{data.customerName || 'Customer'}</div>
              <div className="text-[13px] text-black mt-1 font-semibold">+91-{data.customerPhone}</div>
              {data.customerVillage && <div className="text-[13px] text-gray-600 mt-1">{data.customerVillage}</div>}
            </div>
          </div>

          {/* Full Width Table Area */}
          <div className="w-full mb-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] bg-[#F3F4F6] py-3 px-5 border-b border-gray-200">
              <div className="text-[11px] font-bold text-gray-600 tracking-widest uppercase font-nirand">Descriptions</div>
              <div className="text-[11px] font-bold text-gray-600 tracking-widest uppercase font-nirand text-center">Gross Weight</div>
              <div className="text-[11px] font-bold text-gray-600 tracking-widest uppercase font-nirand text-center">Net Weight</div>
              <div className="text-[11px] font-bold text-gray-600 tracking-widest uppercase font-nirand text-center">Rate ₹</div>
              <div className="text-[11px] font-bold text-gray-600 tracking-widest uppercase font-nirand text-right">Amount ₹</div>
            </div>
            
            {/* Table Row */}
            <div className="grid grid-cols-[3fr_1.2fr_1.2fr_1.2fr_1.5fr] py-5 px-5 bg-white items-center">
              <div>
                <div className="text-[14px] font-bold text-black uppercase font-nirand tracking-wide">{data.metalType}</div>
                <div className="text-[12px] font-semibold text-gray-500 uppercase mt-0.5 tracking-wider">{data.itemCategory} ({data.purity})</div>
              </div>
              <div className="text-[13px] font-bold text-black text-center">{data.netWeight} g</div>
              <div className="text-[13px] font-bold text-black text-center">{data.netWeight} g</div>
              <div className="text-[13px] font-bold text-black text-center">{formatINR(data.ratePerGram)}</div>
              <div className="text-[15px] font-extrabold text-black text-right">{formatINR(data.metalValue)}</div>
            </div>
          </div>

          {/* Bottom Split Section */}
          <div className="flex gap-14 flex-grow">
            
            {/* LEFT COLUMN: Payment + T&C */}
            <div className="w-[60%] flex flex-col">
              
              {/* Payment Details */}
              <div className="mb-8">
                <div className="text-[12px] font-bold text-[#3A2E8A] tracking-widest mb-3 uppercase font-nirand">PAYMENT DETAILS</div>
                <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 text-[12px] text-black mb-4 pl-1">
                  <span className="font-bold text-gray-500">Advance UPI:</span>
                  <span className="font-bold">₹ 0 /-</span>
                  <span className="font-bold text-gray-500">Date Paid:</span>
                  <span className="font-bold">{data.date}</span>
                </div>
                
                {/* Modern Status Badge */}
                <div className="flex items-center gap-10 bg-[#F8F9FA] py-3 px-5 rounded-md border border-gray-200 w-fit">
                  <div className="text-[13px]">
                    <span className="font-bold text-gray-500 uppercase tracking-wide mr-3">Paid:</span>
                    <span className="font-extrabold text-black">₹ {formatINR(data.grandTotal)} /-</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="text-[13px]">
                    <span className="font-bold text-gray-500 uppercase tracking-wide mr-3">Total Paid:</span>
                    <span className="font-extrabold text-[#3A2E8A]">₹ {formatINR(data.grandTotal)} /-</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="mt-auto pb-4">
                <div className="text-[10px] font-bold text-black tracking-widest mb-2.5 uppercase font-nirand">TERMS AND CONDITIONS FOR JEWELRY SALE</div>
                <div className="text-[8.5px] text-gray-600 text-justify leading-[1.6] pr-8">
                  <ol className="list-decimal pl-3.5 space-y-1">
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
              </div>

            </div>

            {/* RIGHT COLUMN: QR + Totals */}
            <div className="w-[40%] flex flex-col justify-between pb-4">
              
              {/* QR Code - Aligned Right */}
              <div className="flex justify-end mb-4 pt-2 pr-2">
                <div className="text-center">
                  <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm mb-2 inline-block">
                    <img src={qrCodeImage} alt="QR Code" className="w-[85px] h-[85px] object-cover rounded-lg" />
                  </div>
                  <div className="text-[9px] font-bold text-[#3A2E8A] uppercase font-nirand tracking-[0.2em]">SCAN TO PAY</div>
                </div>
              </div>

              {/* Totals Section - Beautifully Crafted */}
              <div className="bg-[#F8F9FA] p-6 rounded-xl border border-gray-200 mt-auto shadow-sm">
                <div className="flex justify-between py-1.5 text-[13px] font-bold text-black border-b border-gray-200 pb-3 mb-3">
                  <span className="font-nirand uppercase tracking-widest text-gray-500">TOTAL AMOUNT</span>
                  <span className="font-extrabold">{formatINR(data.metalValue)}</span>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[12.5px]">
                    <span className="font-nirand text-gray-600 font-semibold">Making Charges</span>
                    <span className="font-bold text-black">{formatINR(data.makingCharges)}</span>
                  </div>
                  {data.discount > 0 && (
                    <div className="flex justify-between text-[12.5px]">
                      <span className="font-nirand text-gray-600 font-semibold">Discount</span>
                      <span className="font-bold text-green-600">-{formatINR(data.discount)}</span>
                    </div>
                  )}
                  {data.gstAmount > 0 && (
                    <div className="flex justify-between text-[12.5px]">
                      <span className="font-nirand text-gray-600 font-semibold">GST (3%)</span>
                      <span className="font-bold text-black">{formatINR(data.gstAmount)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-300">
                  <span className="font-nirand font-bold text-[15px] tracking-widest text-[#3A2E8A] uppercase">GRAND TOTAL</span>
                  <span className="font-extrabold text-[18px] text-[#3A2E8A]">₹ {formatINR(data.grandTotal)}</span>
                </div>
              </div>

            </div>
          </div>
          
        </div>

        {/* Huge Black Footer */}
        <div className="bg-[#1A1A1A] w-full text-white px-16 py-5 flex justify-between items-center z-10 relative">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-bold tracking-[0.25em] text-gray-400 font-nirand">FINANCE PARTNER</span>
            <div className="flex flex-col items-center">
              <img src={premiumLogo} alt="aarthika" className="h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="text-[8px] tracking-widest mt-0.5 text-center text-gray-400">finance</span>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-400 text-right space-y-1.5 font-semibold tracking-wide">
            <div className="flex items-center justify-end gap-2">
              <span>Contact : info@aarthikafinance.com | 0203 68541</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              <span>www.aarthikafinance.com</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
