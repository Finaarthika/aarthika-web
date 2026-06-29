import React, { useEffect, useState } from 'react';
import html2pdf from 'html2pdf.js';
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
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' } // Landscape for this tabular layout
      };
      html2pdf().set(opt).from(element).save().then(() => {
        window.dispatchEvent(new Event('afterprint'));
      });
    } else {
      window.print();
    }
  };

  if (!data) return <div className="p-10 text-center font-sans text-gray-500">No purchase data found in session.</div>;

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees Only';
  };

  const purchasedItems = data.purchasedItems || [];
  const goldItems = purchasedItems.filter(i => i.metalType !== 'Silver');
  const silverItems = purchasedItems.filter(i => i.metalType === 'Silver');

  const goldWeight = data.goldWeight || goldItems.reduce((a, i) => a + (Number(i.weight) || 0), 0);
  const silverWeight = data.silverWeight || silverItems.reduce((a, i) => a + (Number(i.weight) || 0), 0);
  
  // Calculate average purity
  const goldPurity = goldItems.length > 0 ? (goldItems.reduce((a, i) => a + (Number(i.purity) || 0), 0) / goldItems.length) : 0;
  const silverPurity = silverItems.length > 0 ? (silverItems.reduce((a, i) => a + (Number(i.purity) || 0), 0) / silverItems.length) : 0;

  const goldRate = data.goldScrapRate || 0;
  const silverRate = data.silverScrapRate || 0;

  return (
    <div className="bg-[#525659] text-black w-full min-h-screen print:min-h-0 relative flex print:block items-center justify-center print:p-0 print:m-0" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; background: white !important; height: 100% !important; }
          ::-webkit-scrollbar { display: none !important; }
          body * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-container {
            position: relative !important; margin: 0 auto !important; padding: 0 !important;
            box-shadow: none !important; width: 210mm !important; height: 148mm !important;
            page-break-after: always !important; overflow: hidden !important;
          }
        }
        
        .custom-table { width: 100%; border-collapse: collapse; }
        .custom-table th, .custom-table td { border: 1px solid #000; padding: 2px 6px; font-size: 11px; }
        .custom-header { color: #0056b3; font-weight: bold; font-size: 12px; margin-top: 6px; margin-bottom: 2px; }
      `}</style>

      {/* Screen Controls */}
      <div className="no-print bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
        <div className="text-sm font-semibold tracking-wide">Old Purchase Receipt Preview</div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded text-sm font-bold shadow-lg transition-all">
            {isMobileEngine ? 'DOWNLOAD PDF' : 'PRINT / SAVE AS PDF'}
          </button>
          <button onClick={() => window.history.back()} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded text-sm font-bold">
            ← Back
          </button>
        </div>
      </div>

      {/* A5 Landscape Receipt Canvas */}
      <div id="actual-receipt-content" className="print-container w-[210mm] h-[148mm] bg-white relative flex flex-col shadow-2xl print:shadow-none my-16 print:my-0 mx-auto overflow-hidden box-border p-[10mm]">

        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2">
            <img src={aarthikaLogo} alt="Aarthika" className="h-6 object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-[18px] font-bold leading-none">BUYING AGREEMENT</h1>
            <div className="text-[9px] text-gray-700 mt-1">
              Receipt ID: {data.invoiceNo} | Date: {data.date} | Time: {new Date().toLocaleTimeString('en-IN', { hour12: false })}
            </div>
          </div>
        </div>

        {/* Customer Details Table */}
        <table className="custom-table mb-1">
          <tbody>
            <tr>
              <td className="w-1/3"><b>Branch:</b> MISHRA JEWELLER'S</td>
              <td className="w-1/3"><b>Seller Name:</b> {data.customerName.toUpperCase()}</td>
              <td className="w-1/3"><b>Phone Number:</b> +91-{data.customerPhone}</td>
            </tr>
            <tr>
              <td><b>Village:</b> {data.customerVillage?.toUpperCase() || 'N/A'}</td>
              <td><b>Vector Secured:</b> {data.faceVectorStr ? 'YES (512D)' : 'NO'}</td>
              <td><b>Receipt ID:</b> {data.invoiceNo}</td>
            </tr>
          </tbody>
        </table>

        {/* Ornament Details */}
        <div className="custom-header">Ornament Details</div>
        <table className="custom-table mb-1">
          <tbody>
            <tr>
              <td colSpan="3" className="bg-gray-50">
                Description: {data.itemsDescription || 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="w-[30%] align-top">
                <div className="font-bold text-center mb-1">GOLD</div>
                <div className="grid grid-cols-[50px_1fr] gap-x-2 text-[10px]">
                  <b>Weight:</b> <span>{goldWeight.toFixed(3)} g</span>
                  <b>Purity:</b> <span>{goldPurity.toFixed(2)}%</span>
                  <b>Rate:</b> <span>{goldRate}/g</span>
                </div>
              </td>
              <td className="w-[30%] align-top">
                <div className="font-bold text-center mb-1">SILVER</div>
                <div className="grid grid-cols-[50px_1fr] gap-x-2 text-[10px]">
                  <b>Weight:</b> <span>{silverWeight.toFixed(3)} g</span>
                  <b>Purity:</b> <span>{silverPurity.toFixed(2)}%</span>
                  <b>Rate:</b> <span>{silverRate}/g</span>
                </div>
              </td>
              <td className="w-[40%] text-center align-middle relative">
                <div className="font-bold mb-1 uppercase tracking-wide">TOTAL SALE AMOUNT</div>
                <div className="text-[16px] font-bold mb-1">{data.finalValue}/-</div>
                <div className="text-[9px] italic text-gray-700">{numberToWords(data.finalValue)}</div>
                <div className="text-[9px] font-bold mt-1">Sale Date: {data.date}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Verification Photos */}
        <div className="custom-header">Verification Photos</div>
        <table className="custom-table mb-1">
          <tbody>
            <tr>
              <td className="w-1/2 text-center align-middle h-[140px] p-1">
                <div className="font-bold text-[10px] mb-1">Seller Photo</div>
                {data.customerPhoto ? (
                  <img src={data.customerPhoto.startsWith('data:') ? data.customerPhoto : `data:image/jpeg;base64,${data.customerPhoto}`} className="h-[110px] object-contain mx-auto" alt="Seller" />
                ) : (
                  <div className="text-gray-400">NO PHOTO</div>
                )}
              </td>
              <td className="w-1/2 text-center align-middle h-[140px] p-1">
                <div className="font-bold text-[10px] mb-1">Ornament Photo</div>
                {data.jewelleryPhoto ? (
                  <img src={data.jewelleryPhoto.startsWith('data:') ? data.jewelleryPhoto : `data:image/jpeg;base64,${data.jewelleryPhoto}`} className="h-[110px] object-contain mx-auto" alt="Ornament" />
                ) : (
                  <div className="text-gray-400">NO PHOTO</div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terms and Conditions */}
        <div className="border border-black p-1.5 text-[7px] leading-[1.1] mb-2 flex-grow overflow-hidden">
          <ol className="list-decimal pl-4 m-0">
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
          <div className="text-center italic mt-1 text-[8px]">User: {data.officerName || 'Staff'}</div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-auto pt-2">
          <div className="w-[150px]">
            <div className="border-t border-black pt-1 text-[9px] font-bold">Authorized Signature</div>
            <div className="text-[8px]">Aarthika</div>
          </div>
          <div className="w-[150px] text-right">
            <div className="border-t border-black pt-1 text-[9px] font-bold">Seller's Signature</div>
          </div>
        </div>

      </div>
    </div>
  );
}
