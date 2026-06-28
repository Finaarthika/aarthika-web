import React, { useEffect, useState } from 'react';
import html2pdf from 'html2pdf.js';
import premiumLogo from '../../assets/3.png';
import aarthikaLogo from '../../assets/Aarthika (1).png';

export default function OldJewelleryPrint() {
  const [data, setData] = useState(null);
  const [isMobileEngine, setIsMobileEngine] = useState(false);

  useEffect(() => {
    document.body.classList.add('printing-a5');
    setIsMobileEngine(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    return () => {
      document.body.classList.remove('printing-a5');
    };
  }, []);

  useEffect(() => {
    const rawData = localStorage.getItem('aarthika_old_invoice');
    if (rawData) {
      setData(JSON.parse(rawData));
    }
  }, []);

  useEffect(() => {
    if (!isMobileEngine && data) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isMobileEngine, data]);

  const handlePrint = () => {
    if (isMobileEngine) {
      const element = document.getElementById('actual-receipt-content');
      const opt = {
        margin:       0,
        filename:     `Old-Jewellery-Purchase-${data?.invoiceNo || 'receipt'}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 3, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        window.dispatchEvent(new Event('afterprint'));
      });
    } else {
      window.print();
    }
  };

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No purchase data found in session.</div>;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

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
          }
        `}
      </style>

      {/* Screen-only Print Controls */}
      <div className="absolute top-4 right-4 z-50 print:hidden flex gap-2">
        <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          {isMobileEngine ? 'Download PDF' : 'Print A5 Receipt'}
        </button>
        <button onClick={() => window.history.back()} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg">Back</button>
      </div>

      <div id="actual-receipt-content" className="bg-white w-full max-w-[148mm] min-h-[210mm] print:w-[148mm] print:h-[210mm] relative mx-auto shadow-2xl print:shadow-none overflow-hidden flex flex-col font-['Red_Hat_Display']">
        
        {/* Header */}
        <div className="bg-[#1B1464] text-white p-4 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg shrink-0">
              <img src={premiumLogo} alt="Logo" className="w-full h-full object-contain" style={{ filter: 'brightness(1.1)' }} />
            </div>
            <div>
              <img src={aarthikaLogo} alt="Aarthika" className="h-4 object-contain brightness-0 invert opacity-95 mb-0.5" />
              <div className="text-[7px] font-bold text-indigo-200 tracking-[0.2em] uppercase leading-none">Enterprise Purchase Terminal</div>
            </div>
          </div>
          
          <div className="text-right relative z-10">
            <div className="text-[10px] font-black tracking-widest text-emerald-400">OLD JEWELLERY PURCHASE</div>
            <div className="text-[8px] text-indigo-200 font-medium mt-0.5">Inv: {data.invoiceNo}</div>
          </div>
        </div>

        {/* Store Info */}
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">MISHRA JEWELLER'S</h1>
            <p className="text-[8px] font-medium text-gray-500 mt-0.5">Purani Gali, Kishanganj (Bihar) 855107</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Purchase Date</p>
            <p className="text-[9px] font-bold text-gray-800">{data.date}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Customer Profile</p>
              <p className="text-sm font-black text-gray-900 leading-none mb-1">{data.customerName}</p>
              <p className="text-[9px] font-medium text-gray-600">{data.customerVillage}</p>
              <p className="text-[9px] font-medium text-gray-600">Ph: {data.customerPhone}</p>
            </div>
            {data.faceVectorStr && (
              <div className="text-right">
                <div className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 text-[6px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Face Authenticated</div>
                <div className="mt-1 w-16 h-16 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 shrink-0">
                  {data.customerPhoto ? <img src={data.customerPhoto} className="w-full h-full object-cover" /> : <span className="text-[6px] text-gray-400">NO PIC</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items Details */}
        <div className="p-5 flex-grow">
          <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-3">Item Assessment</p>
          
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
            <p className="text-[10px] font-bold text-gray-800 mb-1 leading-snug">{data.itemsDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-gray-200 rounded-lg p-2 text-center">
               <p className="text-[7px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Gross Weight</p>
               <p className="text-xs font-black text-gray-900">{data.grossWeight} g</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-2 text-center">
               <p className="text-[7px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Melting Purity</p>
               <p className="text-xs font-black text-gray-900">{data.meltingPurity}%</p>
            </div>
          </div>
        </div>

        {/* Footer Totals */}
        <div className="bg-[#1B1464] text-white p-5 rounded-t-3xl shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl transform translate-x-10 translate-y-10"></div>
          
          <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-3 mb-3">
             <div className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Final Purchase Value</div>
             <div className="text-2xl font-black text-emerald-400">{formatINR(data.finalValue)}</div>
          </div>
          
          <div className="relative z-10 flex justify-between items-end mt-4">
            <div className="w-24">
              <div className="border-b border-white/30 pb-1 mb-1">
                <p className="text-[6px] text-center text-white/50 uppercase tracking-widest">Customer Signature</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-bold text-white uppercase tracking-widest">Aarthika Security System</p>
              <p className="text-[6px] text-indigo-300 mt-0.5">Ver: OP-{data.invoiceNo}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
