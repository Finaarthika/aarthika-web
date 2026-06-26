import React from 'react';
import premiumLogo from '../../assets/3.png';
import watermarkImg from '../../assets/watermark.png';

export default function CreditAgreementPDF({ data, id = "credit-agreement-pdf" }) {
  if (!data) return null;

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div id={id} className="w-[794px] h-[1123px] bg-white text-black flex flex-col relative overflow-hidden box-border mx-auto p-12" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;800&display=swap');
          .font-nirand { font-family: "Nirand", "Red Hat Display", sans-serif; }
          .font-redhat { font-family: "Red Hat Display", sans-serif; }
        `}
      </style>

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
        <img src={watermarkImg} alt="Watermark" className="w-[80%] object-contain grayscale" />
      </div>

      <div className="relative z-10 w-full flex flex-col h-full">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-[#1B1464] pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black font-redhat text-[#1B1464] tracking-tight uppercase">Mishra Jeweler's</h1>
            <p className="text-sm font-bold tracking-widest text-amber-600 uppercase mt-2">Official Credit Financing Agreement</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-500">Invoice: <span className="text-black uppercase">{data.invoiceNo}</span></p>
            <p className="text-sm font-bold text-gray-500">Date: <span className="text-black">{data.date}</span></p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-[#F8F9FA] border-2 border-[#1B1464] rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-extrabold tracking-widest text-[#1B1464] uppercase mb-4 border-b border-gray-300 pb-2">Financial Obligation Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase">Gross Transaction Value</span>
              <span className="text-2xl font-black text-gray-800">{formatINR(data.finalDue !== undefined ? data.finalDue : data.grandTotal)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase">Amount Paid Upfront</span>
              <span className="text-2xl font-black text-green-600">{formatINR(data.finalPaid)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-600 uppercase">Credit Financed (Due)</span>
              <span className="text-2xl font-black text-red-600">{formatINR(data.creditAmount)}</span>
            </div>
          </div>
        </div>

        {/* KYC & Biometric Data */}
        <h2 className="text-sm font-extrabold tracking-widest text-[#1B1464] uppercase mb-4 border-b-2 border-gray-200 pb-2">Identity & Biometric Verification</h2>
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Customer Info */}
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex bg-gray-50 p-2 rounded border border-gray-200"><strong className="w-24 text-gray-500">Name:</strong> <span>{data.customerName}</span></div>
            <div className="flex bg-gray-50 p-2 rounded border border-gray-200"><strong className="w-24 text-gray-500">Phone:</strong> <span>+91-{data.customerPhone}</span></div>
            <div className="flex bg-gray-50 p-2 rounded border border-gray-200"><strong className="w-24 text-gray-500">Location:</strong> <span>{data.customerVillage || 'N/A'}</span></div>
            <div className="flex bg-gray-50 p-2 rounded border border-gray-200"><strong className="w-24 text-gray-500">Face Vector:</strong> <span className="text-[8px] font-mono leading-tight break-all text-gray-600">{data.faceVectorStr ? (data.faceVectorStr.substring(0, 80) + '... [512D Secured]') : 'Not Extracted'}</span></div>
          </div>
          
          {/* Live Photo & ID */}
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col items-center">
              <div className="w-full aspect-square border-2 border-gray-300 p-1 rounded-xl shadow-sm bg-white mb-2">
                {data.customerPhoto ? <img src={data.customerPhoto} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">NO PHOTO</div>}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Capture</span>
            </div>
            <div className="w-1/2 flex flex-col items-center">
              <div className="w-full aspect-square border-2 border-gray-300 p-1 rounded-xl shadow-sm bg-white mb-2">
                {data.govtIdPhoto ? <img src={data.govtIdPhoto} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">NO ID</div>}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Govt ID</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <h2 className="text-sm font-extrabold tracking-widest text-[#1B1464] uppercase mb-4 border-b-2 border-gray-200 pb-2">Terms & Conditions of Credit</h2>
        <div className="text-xs text-gray-700 leading-relaxed space-y-3 mb-10 text-justify border border-gray-200 bg-gray-50 p-6 rounded-xl">
          <p><strong>1. ACKNOWLEDGMENT OF DEBT:</strong> The Customer hereby acknowledges borrowing and taking possession of the specified jewellery items against the stated Credit Financed amount of {formatINR(data.creditAmount)} on the date {data.date}.</p>
          <p><strong>2. PAYMENT OBLIGATION:</strong> The Customer agrees to repay the full Credit Financed amount to Aarthika / Mishra Jeweler's within the verbally or written stipulated timeframe. Failure to repay will result in standard legal recovery proceedings.</p>
          <p><strong>3. BIOMETRIC & IDENTITY CONSENT:</strong> The Customer explicitly consents to the secure capture, algorithmic extraction (512D Vector mapping), and storage of their live facial photograph, Government ID, and Signature for anti-fraud and recovery purposes. This data will be maintained under strict internal security protocols.</p>
          <p><strong>4. OWNERSHIP:</strong> While physical possession of the jewellery is transferred to the Customer, the full legal title remains with Aarthika / Mishra Jeweler's until the outstanding credit balance is fully settled.</p>
        </div>

        <div className="flex-grow"></div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-300">
          <div className="flex flex-col items-center w-64">
            <div className="h-24 w-full border-b border-gray-400 flex items-center justify-center mb-2 bg-gray-50 relative rounded-t-lg">
              <div className="absolute inset-0 flex items-center justify-center opacity-10 font-bold text-xl uppercase tracking-widest pointer-events-none">OFFICIAL SEAL</div>
            </div>
            <span className="text-xs font-bold text-gray-800 uppercase tracking-widest">Authorized Officer</span>
          </div>
          
          <div className="flex flex-col items-center w-64">
            <div className="h-24 w-full border-b border-gray-400 flex items-end justify-center mb-2 pb-2 bg-gray-50 relative rounded-t-lg">
               {data.signaturePhoto ? (
                 <img src={data.signaturePhoto} alt="Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
               ) : (
                 <span className="text-gray-300 text-sm italic">Not Signed</span>
               )}
            </div>
            <span className="text-xs font-bold text-gray-800 uppercase tracking-widest">Customer Signature</span>
          </div>
        </div>

      </div>
    </div>
  );
}
