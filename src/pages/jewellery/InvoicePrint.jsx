import React, { useEffect, useState } from 'react';
import premiumLogo from '../../assets/3.png';

export default function InvoicePrint() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Read the invoice data passed from the terminal
    const rawData = sessionStorage.getItem('aarthika_current_invoice');
    if (rawData) {
      setData(JSON.parse(rawData));
      // Give images time to load, then open the print dialog
      setTimeout(() => {
        window.print();
      }, 1500);
    }
  }, []);

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No invoice data found in session.</div>;

  const formatINR = (amount) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="bg-white text-black font-sans w-full">
      
      {/* 
        Print styling ensures this looks exactly like the Canva A4 portrait export.
        We avoid height restrictions to prevent Chrome print preview from rendering blank.
      */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
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
      `}</style>

      {/* Control Panel (Hidden during print) */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
        <div className="text-sm">Native PDF Generation Active</div>
        <button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-sm font-bold tracking-widest uppercase font-sans">
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Canvas (A4 Size approximately 794px width for screen viewing) */}
      <div className="print-container max-w-[794px] mx-auto bg-white pt-20 no-print:mt-16 no-print:shadow-2xl relative min-h-[1123px] flex flex-col">
        
        {/* Inner Padding Wrapper */}
        <div className="px-12 pt-8 flex-grow">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-medium tracking-wide" style={{ color: '#3A2E8A', fontFamily: '"Georgia", serif' }}>MISHRA JEWELER'S</h1>
              <p className="text-[10px] font-bold tracking-widest mt-1" style={{ color: '#3A2E8A' }}>GOLD & SILVER</p>
            </div>
            <div className="text-[10px] text-gray-700 space-y-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <svg className="w-3 h-3 text-[#3A2E8A]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                <span>+91-06205168541</span>
              </div>
              <div className="flex items-start justify-end gap-2 text-right max-w-[200px]">
                <svg className="w-3 h-3 text-[#3A2E8A] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                <span>Dharampur & Daliganj, Uttar Dinajpur, West Bengal, Pin Code : 733210</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t" style={{ borderColor: '#E5E5E5' }}></div>

          {/* Title and Meta */}
          <div className="flex justify-between items-start mt-8 mb-8">
            <div>
              <h2 className="text-4xl font-normal text-black mb-4">INVOICE</h2>
              <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px] text-black">
                <span className="font-semibold">Invoice date:</span>
                <span>{data.date}</span>
                <span className="font-semibold">Invoice Number:</span>
                <span>{data.invoiceNo}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-500 tracking-wide mb-1">INVOICE TO</div>
              <div className="text-sm font-bold text-black">{data.customerName || 'Customer'}</div>
              <div className="text-[11px] text-black mt-1">+91-{data.customerPhone}</div>
              {data.customerVillage && <div className="text-[11px] text-black w-48 text-right ml-auto leading-tight mt-1">{data.customerVillage}</div>}
            </div>
          </div>

          {/* Table */}
          <div className="w-full mb-8">
            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr] gap-2 bg-[#F3F4F6] py-2 px-4 text-[9px] font-bold text-black border-y border-gray-200">
              <div>DESCRIPTIONS</div>
              <div className="text-center">GROSS<br/>WEIGHT</div>
              <div className="text-center">NET<br/>WEIGHT</div>
              <div className="text-center">RATE<br/>₹</div>
              <div className="text-right">AMOUNT<br/>₹</div>
            </div>
            
            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr] gap-2 py-4 px-4 text-[11px] text-black border-b border-gray-200 items-center">
              <div>
                <div className="font-bold uppercase mb-1">{data.metalType}</div>
                <div className="text-gray-600 uppercase">{data.itemCategory} ({data.purity})</div>
              </div>
              <div className="text-center">{data.netWeight}</div>
              <div className="text-center">{data.netWeight}</div>
              <div className="text-center">{formatINR(data.ratePerGram)}</div>
              <div className="text-right">{formatINR(data.metalValue)}</div>
            </div>
          </div>

          {/* Image Section */}
          {data.jewelleryPhoto && (
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="text-[11px] font-bold tracking-wide" style={{ color: '#3A2E8A' }}>JEWELLERY IMAGE</div>
              <div className="flex-grow flex justify-center">
                <div className="w-32 h-32 bg-red-600 rounded-xl overflow-hidden flex items-center justify-center shadow-inner border border-gray-200">
                  <img src={data.jewelleryPhoto} alt="Jewellery" className="max-w-full max-h-full object-cover" />
                </div>
              </div>
              <div className="w-24"></div> {/* spacer to balance the flex */}
            </div>
          )}

          {/* Totals Section */}
          <div className="w-full flex justify-end mb-8 px-4">
            <div className="w-[300px]">
              <div className="flex justify-between py-1 text-[11px] font-bold text-black">
                <span>TOTAL AMOUNT</span>
                <span>{formatINR(data.metalValue)}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-gray-700">
                <span>Making Charges</span>
                <span>{formatINR(data.makingCharges)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between py-1 text-[11px] text-gray-700">
                  <span>Discount</span>
                  <span>-{formatINR(data.discount)}</span>
                </div>
              )}
              {data.gstAmount > 0 && (
                <div className="flex justify-between py-1 text-[11px] text-gray-700">
                  <span>GST (3%)</span>
                  <span>{formatINR(data.gstAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-3 mt-2 border-t border-b border-gray-200 font-bold text-[12px] text-black">
                <span>GRAND TOTAL AMOUNT</span>
                <span>₹ {formatINR(data.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="px-4 mb-10">
            <div className="text-[10px] font-bold text-black mb-2">PAYMENT DETAILS</div>
            <div className="grid grid-cols-[100px_1fr] gap-1 text-[11px] text-black mb-4">
              <span>Advance UPI :</span>
              <span>₹ 0 /-</span>
              <span>Date Paid :</span>
              <span>{data.date}</span>
            </div>
            
            <div className="flex items-center gap-12 text-[12px] font-bold text-black">
              <div className="flex gap-4">
                <span>Paid</span>
                <span>: ₹ {formatINR(data.grandTotal)} /-</span>
              </div>
              <div className="flex gap-4">
                <span>Total Paid</span>
                <span>: ₹ {formatINR(data.grandTotal)} /-</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="px-4 mb-16">
            <div className="text-[8px] font-bold text-black mb-1">TERMS & CONDITIONS</div>
            <div className="text-[8px] text-gray-600">Be sure to do the payment within 15 days after receiving this invoice to avoid any penalty charges.</div>
          </div>
          
        </div>

        {/* Huge Black Footer */}
        <div className="bg-[#1A1A1A] w-full text-white px-12 py-6 flex justify-between items-center mt-auto">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold tracking-widest text-gray-400">FINANCE PARTNER</span>
            <div className="flex flex-col">
              <img src={premiumLogo} alt="aarthika" className="h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="text-[8px] tracking-widest ml-1 mt-1 text-center">finance</span>
            </div>
          </div>
          
          <div className="text-[9px] text-gray-300 text-right space-y-1">
            <div className="flex items-center justify-end gap-2">
              <span>Contact : info@aarthikafinance.com | 0203 68541</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              <span>www.aarthikafinance.com</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
