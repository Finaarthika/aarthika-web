import React from 'react';

export default function DetailedA4Receipt({ data, id = "detailed-a4-receipt" }) {
  if (!data) return null;

  const silverItems = data.items?.filter(i => i.metalType === 'Silver') || [];
  const goldItems = data.items?.filter(i => i.metalType === 'Gold') || [];

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div id={id} className="w-[210mm] h-[297mm] bg-white p-10 box-border text-black absolute top-0 left-[-9999px] z-[-9999]" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-widest text-gray-900">MISHRA JEWELER'S</h1>
        <p className="text-sm font-bold text-gray-600 tracking-widest">DETAILED INTERNAL VAULT RECORD</p>
      </div>

      <div className="flex justify-between items-start mb-10">
        <div className="w-1/2">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">Transaction Details</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="py-1 font-semibold w-1/3">Invoice No:</td><td className="py-1">{data.invoiceNo}</td></tr>
              <tr><td className="py-1 font-semibold">Date:</td><td className="py-1">{data.date}</td></tr>
              <tr><td className="py-1 font-semibold">Customer:</td><td className="py-1">{data.customerName}</td></tr>
              <tr><td className="py-1 font-semibold">Phone:</td><td className="py-1">{data.customerPhone}</td></tr>
              <tr><td className="py-1 font-semibold">Village:</td><td className="py-1">{data.customerVillage || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>
        
        <div className="w-1/2 flex justify-end gap-6">
          <div className="flex flex-col items-center">
            <div className="w-[75px] h-[75px] border-2 border-gray-400 p-1 bg-gray-50 mb-2">
              {data.customerPhoto ? (
                <img src={data.customerPhoto} alt="Customer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Photo</div>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Customer</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-[75px] h-[75px] border-2 border-gray-400 p-1 bg-gray-50 mb-2">
              {data.jewelleryPhoto ? (
                <img src={data.jewelleryPhoto} alt="Jewellery" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Photo</div>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Jewellery</span>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">Itemized Breakdown</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border border-gray-300 font-bold w-12 text-center">#</th>
              <th className="p-3 border border-gray-300 font-bold">Metal</th>
              <th className="p-3 border border-gray-300 font-bold">Description</th>
              <th className="p-3 border border-gray-300 font-bold text-right">Weight</th>
              <th className="p-3 border border-gray-300 font-bold text-right">Rate</th>
              <th className="p-3 border border-gray-300 font-bold text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="p-3 border border-gray-300 text-center">{idx + 1}</td>
                <td className="p-3 border border-gray-300 font-semibold">{item.metalType}</td>
                <td className="p-3 border border-gray-300 uppercase">{item.desc || 'Jewellery Item'}</td>
                <td className="p-3 border border-gray-300 text-right">{item.netWeight}g</td>
                <td className="p-3 border border-gray-300 text-right">{formatINR(item.rate)}</td>
                <td className="p-3 border border-gray-300 text-right">{formatINR((parseFloat(item.netWeight) || 0) * (parseFloat(item.rate) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="w-1/2 ml-auto">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-2 text-gray-600">Total Metal Value:</td>
              <td className="py-2 text-right font-semibold">{formatINR(data.metalValue)}</td>
            </tr>
            {parseFloat(data.goldMakingCharges) > 0 && (
              <tr>
                <td className="py-2 text-gray-600">Gold Making Charges:</td>
                <td className="py-2 text-right font-semibold">+{formatINR(data.goldMakingCharges)}</td>
              </tr>
            )}
            {parseFloat(data.silverMakingCharges) > 0 && (
              <tr>
                <td className="py-2 text-gray-600">Silver Making Charges:</td>
                <td className="py-2 text-right font-semibold">+{formatINR(data.silverMakingCharges)}</td>
              </tr>
            )}
            {parseFloat(data.discount) > 0 && (
              <tr>
                <td className="py-2 text-red-600">Discount Applied:</td>
                <td className="py-2 text-right font-bold text-red-600">-{formatINR(data.discount)}</td>
              </tr>
            )}
            {parseFloat(data.gstAmount) > 0 && (
              <tr>
                <td className="py-2 text-gray-600">GST (3%):</td>
                <td className="py-2 text-right font-semibold">+{formatINR(data.gstAmount)}</td>
              </tr>
            )}
            <tr className="border-t-2 border-gray-800">
              <td className="py-4 text-lg font-black uppercase">Grand Total:</td>
              <td className="py-4 text-right text-2xl font-black">{formatINR(data.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="absolute bottom-10 left-10 right-10 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        This is an internally generated Vault Record Document. Not for customer distribution.
      </div>
    </div>
  );
}
