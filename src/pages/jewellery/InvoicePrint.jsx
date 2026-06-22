import React, { useEffect, useState } from 'react';
import premiumLogo from '../../assets/3.png';
import qrCodeImage from '../../assets/qr-code.jpeg';
import watermarkImg from '../../assets/Aarthika (1).png'; // Note: The user attached "Aarthika (600 x 200 px) (1).png", but in the assets folder it's named "Aarthika (1).png" based on the ls output.

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
    <div className="bg-white text-black w-full relative" style={{ fontFamily: '"Arial Nova", Arial, sans-serif' }}>
      
      {/* Import requested fonts and set Landscape A4 */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700&display=swap');
          
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
          
          .font-nirand { font-family: "Nirand", sans-serif; }
          .font-redhat { font-family: "Red Hat Display", sans-serif; }
        `}
      </style>

      {/* Control Panel (Hidden during print) */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
        <div className="text-sm">Landscape Native PDF Generation</div>
        <button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-sm font-bold tracking-widest uppercase font-sans">
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Canvas (A4 Landscape is approximately 1123px wide and 794px high) */}
      <div className="print-container max-w-[1123px] mx-auto bg-white pt-20 no-print:mt-16 no-print:shadow-2xl relative min-h-[794px] flex flex-col overflow-hidden">
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
          <img src={watermarkImg} alt="Watermark" className="w-[600px] object-contain" />
        </div>

        {/* Inner Padding Wrapper */}
        <div className="px-12 pt-6 flex-grow flex flex-col relative z-10">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[32px] font-normal tracking-wide font-redhat" style={{ color: '#3A2E8A' }}>MISHRA JEWELER'S</h1>
              <p className="text-[12px] font-bold tracking-widest mt-1 font-nirand" style={{ color: '#3A2E8A' }}>GOLD & SILVER</p>
            </div>
            <div className="text-[11px] text-gray-700 space-y-1.5 text-right">
              <div className="flex items-center justify-end gap-2">
                <svg className="w-3 h-3 text-[#3A2E8A]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                <span>+91-06205168541</span>
              </div>
              <div className="flex items-start justify-end gap-2 text-right max-w-[220px]">
                <svg className="w-3 h-3 text-[#3A2E8A] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                <span>Dharampur & Daliganj, Uttar Dinajpur, West Bengal, Pin Code : 733210</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t mb-6" style={{ borderColor: '#E5E5E5' }}></div>

          {/* Title and Meta */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[36px] text-black mb-3 uppercase font-nirand">INVOICE</h2>
              <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-[12px] text-black">
                <span className="font-semibold font-nirand">Invoice date:</span>
                <span>{data.date}</span>
                <span className="font-semibold font-nirand">Invoice Number:</span>
                <span>{data.invoiceNo}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-bold text-gray-500 tracking-wide mb-1 uppercase font-nirand">INVOICE TO</div>
              <div className="text-[16px] font-bold text-black">{data.customerName || 'Customer'}</div>
              <div className="text-[13px] text-black mt-1">+91-{data.customerPhone}</div>
              {data.customerVillage && <div className="text-[13px] text-black w-48 text-right ml-auto leading-tight mt-1">{data.customerVillage}</div>}
            </div>
          </div>

          {/* Main Content Split: Left (Jewellery Table/Totals) vs Right (T&C, Payment, QR) */}
          <div className="flex gap-10 flex-grow mt-4">
            
            {/* LEFT COLUMN: Jewellery Details & Totals */}
            <div className="w-[55%] flex flex-col">
              
              {/* Table */}
              <div className="w-full mb-6 border border-gray-200 rounded overflow-hidden">
                <div className="grid grid-cols-[3fr_1.5fr_1.5fr_1.5fr_2fr] gap-2 bg-[#F3F4F6] py-2 px-3 text-[10px] font-bold text-black border-b border-gray-200 font-nirand">
                  <div>DESCRIPTIONS</div>
                  <div className="text-center">GROSS WT.</div>
                  <div className="text-center">NET WT.</div>
                  <div className="text-center">RATE ₹</div>
                  <div className="text-right">AMOUNT ₹</div>
                </div>
                
                <div className="grid grid-cols-[3fr_1.5fr_1.5fr_1.5fr_2fr] gap-2 py-4 px-3 text-[12px] text-black items-center min-h-[120px]">
                  <div>
                    <div className="font-bold uppercase mb-1 font-nirand">{data.metalType}</div>
                    <div className="text-gray-600 uppercase font-nirand">{data.itemCategory} ({data.purity})</div>
                  </div>
                  <div className="text-center">{data.netWeight}</div>
                  <div className="text-center">{data.netWeight}</div>
                  <div className="text-center">{formatINR(data.ratePerGram)}</div>
                  <div className="text-right font-semibold">{formatINR(data.metalValue)}</div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="bg-[#F9FAFB] p-4 rounded border border-gray-200 ml-auto w-[85%]">
                <div className="flex justify-between py-1.5 text-[12px] font-bold text-black">
                  <span className="font-nirand">TOTAL AMOUNT</span>
                  <span>{formatINR(data.metalValue)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-[12px] text-gray-700">
                  <span className="font-nirand">Making Charges</span>
                  <span>{formatINR(data.makingCharges)}</span>
                </div>
                {data.discount > 0 && (
                  <div className="flex justify-between py-1.5 text-[12px] text-gray-700">
                    <span className="font-nirand">Discount</span>
                    <span>-{formatINR(data.discount)}</span>
                  </div>
                )}
                {data.gstAmount > 0 && (
                  <div className="flex justify-between py-1.5 text-[12px] text-gray-700">
                    <span className="font-nirand">GST (3%)</span>
                    <span>{formatINR(data.gstAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 mt-2 border-t border-b border-gray-300 font-bold text-[14px] text-black">
                  <span className="font-nirand">GRAND TOTAL AMOUNT</span>
                  <span>₹ {formatINR(data.grandTotal)}</span>
                </div>
              </div>
              
            </div>


            {/* RIGHT COLUMN: Terms, Payment, QR */}
            <div className="w-[45%] flex flex-col justify-start">
              
              {/* Terms & Conditions */}
              <div className="text-[8px] text-gray-700 text-justify leading-snug mb-6 pr-2">
                <div className="font-bold text-black mb-1.5 text-[10px] uppercase font-nirand">Terms and Conditions for Jewelry Sale</div>
                <ol className="list-decimal pl-4 space-y-1">
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

              {/* Payment Details and QR row */}
              <div className="flex gap-6 items-end mt-auto mb-4 bg-gray-50 p-3 border border-gray-100 rounded">
                
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-black mb-2 uppercase font-nirand">Payment Details</div>
                  <div className="grid grid-cols-[90px_1fr] gap-1 text-[11px] text-black mb-3">
                    <span>Advance UPI :</span>
                    <span>₹ 0 /-</span>
                    <span>Date Paid :</span>
                    <span>{data.date}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-[12px] font-bold text-black">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span>Paid:</span>
                      <span>₹ {formatINR(data.grandTotal)} /-</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Total Paid:</span>
                      <span style={{ color: '#3A2E8A' }}>₹ {formatINR(data.grandTotal)} /-</span>
                    </div>
                  </div>
                </div>

                {/* QR Code embedded on the right */}
                <div className="text-center flex-shrink-0">
                  <img src={qrCodeImage} alt="QR Code" className="w-20 h-20 border border-gray-300 p-1 rounded mb-1 object-cover bg-white" />
                  <div className="text-[8px] font-bold text-gray-500 uppercase font-nirand tracking-wide">Scan to Pay</div>
                </div>

              </div>

            </div>
          </div>
          
        </div>

        {/* Huge Black Footer */}
        <div className="bg-[#1A1A1A] w-full text-white px-12 py-5 flex justify-between items-center mt-6 z-10 relative">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold tracking-widest text-gray-400 font-nirand">FINANCE PARTNER</span>
            <div className="flex flex-col">
              <img src={premiumLogo} alt="aarthika" className="h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="text-[8px] tracking-widest ml-1 mt-0.5 text-center">finance</span>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-300 text-right space-y-1">
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
