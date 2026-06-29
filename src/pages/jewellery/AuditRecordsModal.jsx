import React, { useState, useEffect, useRef } from 'react';

export default function AuditRecordsModal({ isOpen, onClose, customers, modelsLoaded, customFaceNet }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults(customers);
      setSelectedTxn(null);
    }
  }, [isOpen, customers]);

  const handleTextSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(customers);
      return;
    }
    const lowerQ = q.toLowerCase();
    const results = customers.filter(txn => 
      (txn.customerName && txn.customerName.toLowerCase().includes(lowerQ)) ||
      (txn.phone && txn.phone.toLowerCase().includes(lowerQ)) ||
      (txn.village && txn.village.toLowerCase().includes(lowerQ)) ||
      (txn.invoiceNo && txn.invoiceNo.toLowerCase().includes(lowerQ))
    );
    setSearchResults(results);
  };

  const handleFaceScanSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!modelsLoaded || !customFaceNet || !window.faceapi || !window.tf) {
      alert("Biometric engine is still loading. Please wait a moment.");
      return;
    }
    
    setSearchQuery('Scanning face...');
    setSearchResults([]);
    
    try {
      const bmp = await window.createImageBitmap(file);
      const MAX_WIDTH = 600;
      let width = bmp.width;
      let height = bmp.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, width, height);
      
      const detections = await window.faceapi.detectAllFaces(canvas, new window.faceapi.TinyFaceDetectorOptions());
      if (!detections || detections.length === 0) {
        alert("No face detected in the photo! Please ensure proper lighting and try again.");
        setSearchQuery('');
        setSearchResults(customers);
        return;
      }
      
      const box = detections[0].box;
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = 160;
      faceCanvas.height = 160;
      const fctx = faceCanvas.getContext('2d');
      fctx.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, 160, 160);
      
      let tensor = window.tf.browser.fromPixels(faceCanvas);
      tensor = window.tf.cast(tensor, 'float32').sub(127.5).div(127.5).expandDims(0);
      const output = customFaceNet.predict(tensor);
      const rawVectorArray = Array.from(output.dataSync());
      tensor.dispose();
      output.dispose();
      
      let sumSq = 0;
      for (let i = 0; i < rawVectorArray.length; i++) sumSq += rawVectorArray[i] * rawVectorArray[i];
      const magnitude = Math.sqrt(sumSq) || 1;
      const liveDescriptor = new Float32Array(rawVectorArray.map(val => val / magnitude));
      
      const allMatches = [];
      customers.forEach(txn => {
        if (!txn.faceVector || !txn.faceVector.includes(',')) return;
        const storedArray = txn.faceVector.split(',').map(Number);
        if (storedArray.length !== 512) return;
        const storedDescriptor = new Float32Array(storedArray);
        const dist = window.faceapi.euclideanDistance(liveDescriptor, storedDescriptor);
        if (dist < 1.0) {
          allMatches.push({ ...txn, _faceDistance: dist });
        }
      });
      
      allMatches.sort((a, b) => a._faceDistance - b._faceDistance);
      
      setSearchResults(allMatches);
      setSearchQuery('');
      if (allMatches.length === 0) alert("No matching records found for this face.");
    } catch(err) {
      console.error(err);
      alert("Face scan failed.");
      setSearchQuery('');
      setSearchResults(customers);
    }
  };

  const handleSelectTransaction = (txn) => {
    setSelectedTxn(txn);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
      <div className="bg-[#0D0D14] w-full max-w-5xl h-[90vh] rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.15)] border border-rose-500/20 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-500/20 flex justify-between items-center bg-[#151520]">
          <h2 className="text-xl font-black text-rose-200 tracking-wider">VAULT RECORDS <span className="text-white/40 font-normal">| Audit Log</span></h2>
          <button onClick={onClose} className="text-rose-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Panel: Search & List */}
          <div className="w-full md:w-[40%] flex flex-col border-r border-white/5 bg-[#101018]">
            <div className="p-4 border-b border-white/5 space-y-3">
              <input 
                type="text" 
                placeholder="Search by Name, Phone, Invoice No..." 
                value={searchQuery}
                onChange={handleTextSearch}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3 text-rose-100 placeholder-white/30 focus:outline-none focus:border-rose-500/50"
              />
              <label className={`w-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/50 text-rose-200 font-bold tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${!modelsLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8V6a2 2 0 012-2h2M19 8V6a2 2 0 00-2-2h-2M3 16v2a2 2 0 002 2h2M19 16v2a2 2 0 01-2 2h-2M8 12a4 4 0 108 0 4 4 0 00-8 0z" /></svg>
                {modelsLoaded ? 'BIOMETRIC FACE SCAN' : 'LOADING MODELS...'}
                <input type="file" accept="image/*" capture="environment" className="hidden" disabled={!modelsLoaded} onChange={handleFaceScanSearch} />
              </label>
            </div>
            
            <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {searchResults.length === 0 ? (
                <div className="text-center text-white/30 p-8 font-semibold">No records found.</div>
              ) : (
                searchResults.map((txn, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelectTransaction(txn)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTxn === txn ? 'bg-rose-900/30 border-rose-500 shadow-lg' : 'bg-[#151520] border-white/5 hover:bg-[#1A1A24]'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-rose-100 truncate">{txn.customerName}</span>
                      <span className="text-xs font-mono text-rose-400/80 bg-rose-950/50 px-2 py-0.5 rounded">{txn.invoiceNo}</span>
                    </div>
                    <div className="text-sm text-white/50">{txn.phone} | {txn.village}</div>
                    <div className="text-xs text-white/30 mt-2">{txn.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Details */}
          <div className="w-full md:w-[60%] bg-[#0D0D14] flex flex-col items-center justify-center p-6 sm:p-10 relative">
            {!selectedTxn ? (
              <div className="text-white/20 flex flex-col items-center gap-4">
                <svg className="w-20 h-20 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="font-semibold tracking-wider">SELECT A TRANSACTION TO VIEW DETAILS</p>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-[#151520] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                {/* Decorator */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full blur-2xl pointer-events-none"></div>

                <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-rose-100 uppercase tracking-wide">{selectedTxn.customerName}</h3>
                    <p className="text-rose-400/80 text-sm font-semibold tracking-wider mt-1">{selectedTxn.invoiceNo} | {selectedTxn.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Officer</p>
                    <p className="text-sm text-rose-200 font-bold">{selectedTxn.officerName || 'Unknown'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#1A1A24] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Contact</p>
                    <p className="text-white font-semibold">{selectedTxn.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-[#1A1A24] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Village</p>
                    <p className="text-white font-semibold">{selectedTxn.village || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs text-white/40 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Items Details</h4>
                  <div className="text-rose-100 font-medium">
                    {selectedTxn.itemsDescription ? selectedTxn.itemsDescription : 'No item details'}
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="bg-amber-500/10 text-amber-200 px-3 py-1.5 rounded border border-amber-500/20 text-sm font-bold">Gold: {selectedTxn.goldWeight || 0}g</div>
                    <div className="bg-gray-400/10 text-gray-200 px-3 py-1.5 rounded border border-gray-400/20 text-sm font-bold">Silver: {selectedTxn.silverWeight || 0}g</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 p-4 bg-rose-950/20 rounded-xl border border-rose-500/30 relative z-10">
                  <div>
                    <p className="text-[10px] text-rose-400/80 uppercase tracking-widest mb-0.5">Final Value</p>
                    <p className="text-3xl font-black text-rose-400">₹{Number(selectedTxn.finalValue || 0).toLocaleString('en-IN')}</p>
                  </div>
                  {selectedTxn.vaultPdfLink && selectedTxn.vaultPdfLink.startsWith('http') ? (
                    <a href={selectedTxn.vaultPdfLink} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold tracking-wider uppercase text-sm shadow-lg shadow-rose-900/50 transition-all flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      View Drive PDF
                    </a>
                  ) : (
                    <div className="px-6 py-3 bg-white/5 text-white/30 rounded-lg font-bold tracking-wider uppercase text-sm border border-white/10 flex items-center gap-2 cursor-not-allowed">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      No PDF Found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
