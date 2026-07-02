import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import html2pdf from 'html2pdf.js';
import { Camera, CheckCircle, Search, Save, PackagePlus, AlertCircle, TrendingDown, ArrowRight, ShieldCheck, X } from 'lucide-react';
import OldJewelleryPrint from './OldJewelleryPrint';

// --- Toast Component ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed bottom-4 right-4 ${bg} text-white px-6 py-3 rounded shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium tracking-wide">{message}</span>
    </div>
  );
};

// --- Terminal Header ---
const TerminalHeader = ({ officerName, onLogout }) => (
  <div className="flex justify-between items-center bg-gray-900 border-b border-gray-800 px-6 py-3 shrink-0">
    <div className="flex items-center gap-3">
      <ShieldCheck className="w-5 h-5 text-green-500" />
      <div>
        <h1 className="font-bold text-gray-100 tracking-widest text-sm uppercase">Aarthika Security</h1>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest">OLD JEWELLERY INTAKE PROTOCOL</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-xs text-gray-400 font-mono">AUTHORIZED OFFICER</div>
        <div className="text-sm font-bold text-green-400 uppercase tracking-widest">{officerName}</div>
      </div>
      <button onClick={onLogout} className="bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-800/50 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors">
        End Session
      </button>
    </div>
  </div>
);

export default function OldJewelleryTerminal() {
  const [officerAuth, setOfficerAuth] = useState(() => {
    const saved = localStorage.getItem('aarthika_officer_auth');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { loggedIn: false, userId: '', password: '', staffName: '' };
  });

  const checkAuth = async () => {
    const currentAuth = JSON.parse(localStorage.getItem('aarthika_officer_auth') || '{}');
    if (!currentAuth.loggedIn) return false;
    
    try {
      const res = await fetch('https://us-central1-aarthika-backend.cloudfunctions.net/masterApi/read?target=staff');
      const json = await res.json();
      if (json.success && json.data) {
        const staffRow = json.data.find(r => r[0] === currentAuth.userId && r[2] === currentAuth.password);
        if (!staffRow) {
          localStorage.removeItem('aarthika_officer_auth');
          setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
          return false;
        }
      }
      return true;
    } catch (e) {
      return true;
    }
  };

  useEffect(() => {
    if (officerAuth.loggedIn) {
      checkAuth();
    }
  }, [officerAuth.loggedIn]);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // --- Live Rates ---
  const [liveRates, setLiveRates] = useState(null);
  
  // --- Mode ---
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'manual'

  // --- Customer Search & Data ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  // --- Manual Entry Data ---
  const [manualCustomer, setManualCustomer] = useState({ name: '', phone: '', village: '' });
  const [manualItems, setManualItems] = useState([{ name: '', metalType: 'Gold', weight: '', purity: '75', remarks: '' }]);

  // --- Camera & AI Verification ---
  const webcamRef = useRef(null);
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [jewelleryPhoto, setJewelleryPhoto] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [faceVectorStr, setFaceVectorStr] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // --- PDF Payload State ---
  const [payloadForPdf, setPayloadForPdf] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        if (!window.faceapi) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        await Promise.all([
          window.faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          window.faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          window.faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error("FaceAPI Load Error", e);
      }
    };
    loadModels();
    fetchLiveRates();
  }, []);

  const fetchLiveRates = async () => {
    try {
      const res = await fetch('https://us-central1-aarthika-backend.cloudfunctions.net/masterApi/read?target=metal-rates');
      const body = await res.json();
      if (res.ok && body.success && body.data.length > 1) {
        const row = body.data[1];
        setLiveRates({
          goldBuyRate: parseFloat(String(row[1]).replace(/[^0-9.]/g, '')),
          silverBuyRate: parseFloat(String(row[2]).replace(/[^0-9.]/g, '')),
          goldScrapRate: parseFloat(String(row[3]).replace(/[^0-9.]/g, '')),
          silverScrapRate: parseFloat(String(row[4]).replace(/[^0-9.]/g, ''))
        });
      }
    } catch (e) {}
  };

  const getBase64FromUrl = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const capturePhoto = (type) => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (type === 'customer') setCustomerPhoto(imageSrc);
      else setJewelleryPhoto(imageSrc);
    }
  };

  const verifyCustomerFace = async (file) => {
    if (!file) return;
    setIsVerifying(true);
    try {
      if (!modelsLoaded) {
        setIsVerifying(false);
        return showToast("AI Models not loaded yet. Please wait.", "error");
      }

      const img = await window.faceapi.fetchImage(file);
      const detection = await window.faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      
      if (!detection) {
        setIsVerifying(false);
        return showToast("No face detected in photo. Try again.", "error");
      }

      const currentDescriptor = detection.descriptor;
      setFaceVectorStr(currentDescriptor.toString());

      if (activeTab === 'search' && selectedTransaction) {
        // Fetch all transactions to find matching face vector
        const res = await fetch('https://us-central1-aarthika-backend.cloudfunctions.net/masterApi/read?target=jewellery-sales');
        const body = await res.json();
        
        let matchFound = false;
        
        if (body.success && body.data.length > 1) {
          const headers = body.data[0];
          const vectorIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('face vector'));
          const phoneIdx = headers.findIndex(h => h && String(h).toLowerCase().includes('phone'));
          
          if (vectorIdx > -1) {
            for (let i = 1; i < body.data.length; i++) {
              const row = body.data[i];
              if (row[phoneIdx] !== selectedTransaction.phone) continue;
              
              const vecStr = row[vectorIdx];
              if (!vecStr || typeof vecStr !== 'string' || !vecStr.includes(',')) continue;
              
              const storedArray = new Float32Array(vecStr.split(',').map(Number));
              if (storedArray.length !== 512) continue;
              
              const distance = window.faceapi.euclideanDistance(currentDescriptor, storedArray);
              if (distance < 0.5) {
                matchFound = true;
                break;
              }
            }
          }
        }

        if (matchFound) {
          showToast("Identity Verified successfully!", "success");
        } else {
          showToast("Warning: Face does not match previous records.", "error");
        }
      } else {
        showToast("Face captured successfully.", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Face Verification Failed", "error");
    }
    setIsVerifying(false);
  };

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedTransaction(null);
    setSelectedItems([]);
    
    try {
      const res = await fetch('https://us-central1-aarthika-backend.cloudfunctions.net/masterApi/read?target=jewellery-sales');
      const body = await res.json();
      
      if (body.success && body.data.length > 1) {
        const headers = body.data[0];
        const rows = body.data.slice(1);
        
        const q = searchQuery.toLowerCase();
        const matches = rows.filter(row => {
          if (!row || row.length === 0) return false;
          const searchString = `${row[1]} ${row[4]} ${row[5]}`.toLowerCase(); // Inv, Name, Phone
          return searchString.includes(q);
        });

        if (matches.length > 0) {
          // Return all matching transaction rows individually
          const mapped = matches.map(row => ({
            rawRow: row,
            headers: headers,
            invoice: row[1],
            date: row[0],
            name: row[4],
            phone: row[5],
            village: row[6],
            itemsStr: row[7],
            photoUrl: row[18]
          }));
          setSearchResults(mapped);
        } else {
          showToast("No records found", "error");
        }
      }
    } catch (e) {
      showToast("Search failed", "error");
    }
    setIsSearching(false);
  };

  const toggleItemSelection = (index) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const addManualItem = () => {
    setManualItems([...manualItems, { name: '', metalType: 'Gold', weight: '', purity: '75', remarks: '' }]);
  };

  const updateManualItem = (index, field, value) => {
    const updated = [...manualItems];
    updated[index][field] = value;
    setManualItems(updated);
  };

  const removeManualItem = (index) => {
    const updated = [...manualItems];
    updated.splice(index, 1);
    setManualItems(updated);
  };

  // --- Parsers ---
  const parseItemsString = (str) => {
    if (!str) return [];
    return str.split('|').map(item => {
      const parts = item.split(':');
      if (parts.length < 3) return null;
      return {
        name: parts[0].trim(),
        metalType: parts[0].toLowerCase().includes('silver') ? 'Silver' : 'Gold',
        weight: parseFloat(parts[1]) || 0,
        purity: parseFloat(parts[2]) || 75
      };
    }).filter(Boolean);
  };

  const parseKaratToPurity = (k) => {
    if (!k) return 0;
    if (String(k).includes('%')) return parseFloat(k) || 0;
    if (String(k).toLowerCase().includes('k')) {
      const val = parseFloat(k);
      return (val / 24) * 100;
    }
    return parseFloat(k) || 0;
  };

  const parseNumber = (val) => {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
  };

  const calculateFinals = () => {
    let purchasedItems = [];
    let calculatedWeight = 0;
    let goldWeightCalc = 0;
    let silverWeightCalc = 0;
    let calculatedPurity = 0;
    let suggestedValuation = 0;

    if (activeTab === 'search' && selectedTransaction) {
      const allItems = parseItemsString(selectedTransaction.itemsStr);
      purchasedItems = selectedItems.map(idx => allItems[idx]);
    } else {
      purchasedItems = manualItems;
    }

    purchasedItems.forEach(item => {
      const w = parseNumber(item.weight);
      const p = parseKaratToPurity(item.purity);
      calculatedWeight += w;
      if (item.metalType === 'Silver') {
        silverWeightCalc += w;
        suggestedValuation += w * (liveRates?.silverScrapRate || 0) * (p / 100);
      } else {
        goldWeightCalc += w;
        suggestedValuation += w * (liveRates?.goldScrapRate || 0) * (p / 100);
      }
    });

    return { purchasedItems, calculatedWeight, goldWeightCalc, silverWeightCalc, calculatedPurity, suggestedValuation };
  };

  const handlePurchase = async () => {
    try {
      if (activeTab === 'search') {
        if (!selectedTransaction) return showToast('Please select a transaction first.', 'error');
        if (selectedItems.length === 0) return showToast('Please select at least one item to purchase.', 'error');
      } else {
        if (!manualCustomer.name) return showToast('Customer Name is required', 'error');
        if (manualItems.length === 0 || !manualItems[0].name) return showToast('At least one item is required', 'error');
      }

      if (!customerPhoto || !jewelleryPhoto) {
        return showToast("Both Customer and Jewellery photos are mandatory.", "error");
      }

      setIsProcessing(true);
      const { purchasedItems, calculatedWeight, goldWeightCalc, silverWeightCalc, calculatedPurity, suggestedValuation } = calculateFinals();
      
      const finalAgreedValue = Math.round(suggestedValuation); // Auto-set for simplicity in this terminal
      const invoiceNo = `OLD-${Math.floor(1000 + Math.random() * 9000)}`;

      const calculatedDescription = purchasedItems.map(i => `${i.name} (${i.weight}g, ${i.purity}%)`).join(' | ');

      const payload = {
        invoiceNo,
        date: new Date().toLocaleDateString('en-GB'),
        timestamp: new Date().toISOString(),
        officerName: officerAuth.staffName,
        customerName: activeTab === 'search' ? selectedTransaction.name : manualCustomer.name,
        customerPhone: activeTab === 'search' ? selectedTransaction.phone : manualCustomer.phone,
        customerVillage: activeTab === 'search' ? selectedTransaction.village : manualCustomer.village,
        itemsDescription: calculatedDescription,
        grossWeight: calculatedWeight,
        goldWeight: goldWeightCalc,
        silverWeight: silverWeightCalc,
        goldScrapRate: liveRates?.goldScrapRate || 0,
        silverScrapRate: liveRates?.silverScrapRate || 0,
        meltingPurity: calculatedPurity,
        suggestedValuation: Math.round(suggestedValuation),
        finalValue: finalAgreedValue,
        purchasedItems,
        faceVectorStr,
        customerPhoto: customerPhoto.split(',')[1],
        jewelleryPhoto: jewelleryPhoto.split(',')[1]
      };

      // Store payload in state so it renders in the hidden container
      setPayloadForPdf(payload);

    } catch (err) {
      console.error(err);
      showToast("Fatal Error", "error");
      setIsProcessing(false);
    }
  };

  // --- PDF Generation Hook ---
  useEffect(() => {
    if (payloadForPdf && isProcessing) {
      const generatePdfAndSubmit = async () => {
        try {
          showToast("Generating secure vault PDF...", "success");
          
          // Wait for the hidden component to render properly
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const element = document.getElementById('actual-receipt-content');
          if (element) {
            const opt = {
              margin: 0,
              filename: `${payloadForPdf.invoiceNo}_Old_Jewellery.pdf`,
              image: { type: 'jpeg', quality: 1.0 },
              html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1050, logging: false },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true }
            };
            const base64Pdf = await html2pdf().set(opt).from(element).output('datauristring');
            payloadForPdf.vaultPdfFile = base64Pdf.split(',')[1];
          }
          
          const res = await fetch('/api/old-jewellery-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadForPdf)
          });
          
          const data = await res.json();
          if (res.ok) {
            showToast('Purchase Logged Successfully!', 'success');
            localStorage.setItem('aarthika_old_invoice', JSON.stringify(payloadForPdf));
            window.location.href = '/jewellery/old-purchase/print';
          } else {
            showToast(data.message || 'API Error', 'error');
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Silent PDF Generation Error", err);
          showToast('Failed to generate PDF', 'error');
          setIsProcessing(false);
        }
      };
      generatePdfAndSubmit();
    }
  }, [payloadForPdf, isProcessing]);

  if (!officerAuth.loggedIn) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-gray-100 font-mono relative">
      <TerminalHeader officerName={officerAuth.staffName} onLogout={() => { localStorage.removeItem('aarthika_officer_auth'); window.location.href='/jewellery/auth'; }} />
      
      {/* Hidden Print Container for Silent PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <div id="silent-pdf-container">
          {payloadForPdf && <OldJewelleryPrint dataProp={payloadForPdf} silentMode={true} />}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Data Entry */}
        <div className="w-[60%] border-r border-gray-800 flex flex-col bg-[#0a0a0a]">
          
          {/* Mode Selector */}
          <div className="flex border-b border-gray-800 shrink-0">
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'search' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}
            >
              System Search
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'manual' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'}`}
            >
              Manual Entry
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Enter Invoice No, Name, or Phone..." 
                      className="w-full bg-gray-900 border border-gray-700 rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-green-900/30 text-green-500 border border-green-800 px-6 py-2 rounded-md text-sm font-bold tracking-wider hover:bg-green-900/50 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? 'SEARCHING...' : 'EXECUTE'}
                  </button>
                </div>

                {searchResults.length > 0 && !selectedTransaction && (
                  <div className="border border-gray-800 rounded-lg overflow-hidden animate-in fade-in">
                    <div className="bg-gray-900 px-4 py-2 text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-gray-800">
                      Matches Found ({searchResults.length})
                    </div>
                    <div className="divide-y divide-gray-800">
                      {searchResults.map((res, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => { setSelectedTransaction(res); setSelectedItems([]); }}>
                          <div>
                            <div className="font-bold text-green-400">{res.name}</div>
                            <div className="text-xs text-gray-400 mt-1">{res.phone} • {res.village}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-gray-300">{res.invoice}</div>
                            <div className="text-[10px] text-gray-500 mt-1">{res.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTransaction && (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                      <h2 className="text-sm font-bold text-green-400 tracking-widest uppercase">Target Selected</h2>
                      <button onClick={() => setSelectedTransaction(null)} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                        <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">Customer Identity</div>
                        <div className="font-bold">{selectedTransaction.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{selectedTransaction.phone}</div>
                        <div className="text-xs text-gray-400">{selectedTransaction.village}</div>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                        <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">Original Invoice</div>
                        <div className="font-mono text-sm text-green-400">{selectedTransaction.invoice}</div>
                        <div className="text-xs text-gray-400 mt-1">Dated: {selectedTransaction.date}</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-3">Select Items to Buy Back</div>
                      <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                        {parseItemsString(selectedTransaction.itemsStr).map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => toggleItemSelection(idx)}
                            className={`p-4 border-b border-gray-800 last:border-0 cursor-pointer flex items-center gap-4 transition-colors ${selectedItems.includes(idx) ? 'bg-green-900/20' : 'hover:bg-gray-800'}`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selectedItems.includes(idx) ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600'}`}>
                              {selectedItems.includes(idx) && <CheckCircle className="w-3 h-3" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm">{item.name}</div>
                              <div className="text-xs text-gray-400 mt-1">{item.metalType} • {item.weight}g • {item.purity}% Purity</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-8 animate-in fade-in">
                {/* Manual Customer Info */}
                <div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">Walk-in Customer Details</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                      <input type="text" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-green-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
                      <input type="text" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-green-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Village / Address</label>
                      <input type="text" value={manualCustomer.village} onChange={e => setManualCustomer({...manualCustomer, village: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-green-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Manual Items */}
                <div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                    <div className="text-[10px] text-gray-500 tracking-widest uppercase">Item Declaration</div>
                    <button onClick={addManualItem} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 font-bold">
                      <PackagePlus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {manualItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg p-4 relative group">
                        {manualItems.length > 1 && (
                          <button onClick={() => removeManualItem(idx)} className="absolute top-2 right-2 text-gray-600 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-12 md:col-span-6">
                            <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Description</label>
                            <input type="text" placeholder="e.g. Broken Gold Chain" value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none" />
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Metal</label>
                            <select value={item.metalType} onChange={e => updateManualItem(idx, 'metalType', e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none">
                              <option value="Gold">Gold</option>
                              <option value="Silver">Silver</option>
                            </select>
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Wt (g)</label>
                            <input type="number" step="0.01" value={item.weight} onChange={e => updateManualItem(idx, 'weight', e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none" />
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Purity(%)</label>
                            <input type="number" step="0.1" value={item.purity} onChange={e => updateManualItem(idx, 'purity', e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Evidence & Finalization */}
        <div className="w-[40%] flex flex-col bg-[#0f0f11]">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            
            {/* Rates Box */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-3 flex items-center justify-between">
                <span>Live Scrap Rates</span>
                <span className="text-green-500 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Locked</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Gold (24K)</div>
                  <div className="font-mono text-lg text-yellow-500 font-bold">₹{liveRates?.goldScrapRate || '---'}/g</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Silver</div>
                  <div className="font-mono text-lg text-gray-300 font-bold">₹{liveRates?.silverScrapRate || '---'}/g</div>
                </div>
              </div>
            </div>

            {/* Verification Module */}
            <div>
              <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">Security Evidence Capture</div>
              
              <div className="aspect-video bg-black border-2 border-gray-800 rounded-lg overflow-hidden relative group">
                <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <button onClick={() => capturePhoto('customer')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Face
                  </button>
                  <button onClick={() => capturePhoto('jewellery')} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Items
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="relative aspect-square bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group">
                  {customerPhoto ? (
                    <>
                      <img src={customerPhoto} alt="Customer" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2 flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-300">Face Captured</span>
                        <button onClick={() => verifyCustomerFace(customerPhoto)} disabled={isVerifying} className="text-[10px] bg-green-600 px-2 py-1 rounded font-bold disabled:opacity-50">
                          {isVerifying ? 'Scanning...' : 'Verify'}
                        </button>
                      </div>
                    </>
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 font-mono tracking-widest uppercase text-center p-4">Awaiting<br/>Face Scan</div>
                  )}
                </div>
                <div className="relative aspect-square bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  {jewelleryPhoto ? (
                    <>
                      <img src={jewelleryPhoto} alt="Jewellery" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2 text-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-300">Items Captured</span>
                      </div>
                    </>
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 font-mono tracking-widest uppercase text-center p-4">Awaiting<br/>Item Scan</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Checkout Footer */}
          <div className="bg-gray-900 border-t border-gray-800 p-6 shrink-0">
             <button 
               onClick={handlePurchase}
               disabled={isProcessing}
               className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(22,163,74,0.2)]"
             >
               {isProcessing ? 'PROCESSING UPLOAD...' : 'CONFIRM PURCHASE'} 
               {!isProcessing && <ArrowRight className="w-5 h-5" />}
             </button>
             <p className="text-[9px] text-center text-gray-500 mt-3 font-mono tracking-widest">
               By confirming, you agree to transfer funds and assume legal possession of items.
             </p>
          </div>
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
