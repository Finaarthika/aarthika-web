import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';
import AuditRecordsModal from './AuditRecordsModal';

const OfficerHeader = ({ officerName, onLogout, onAuditRecordsClick }) => (
  <div className="sticky top-0 z-50 w-full bg-[#0D0D14] py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-rose-500/20 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center group cursor-default">
        <div className="relative bg-rose-950 rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 border-2 border-rose-500/30">
          <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-100 to-rose-400 tracking-tight flex items-center gap-2">
            AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/30">OLD SCRAP POS</span>
          </span>
          <span className="text-rose-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Purchase Terminal</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 z-10">
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="text-rose-500/60 text-xs font-medium tracking-wider uppercase">Active Purchaser</div>
          <div className="text-rose-100 text-sm font-semibold">{officerName || 'System'}</div>
        </div>
        <button onClick={onAuditRecordsClick} className="group flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/50 px-4 py-2 rounded-xl transition-all duration-300">
          <span className="text-sm font-bold text-rose-200 group-hover:text-white uppercase">Vault Records</span>
        </button>
        <button onClick={onLogout} className="group flex items-center gap-2 bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300">
          <span className="text-sm font-bold text-white group-hover:text-red-400">SECURE LOGOUT</span>
        </button>
      </div>
    </div>
  </div>
);

export default function OldJewelleryTerminal() {
  const navigate = useNavigate();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const getDeviceId = () => {
    let id = localStorage.getItem('aarthika_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('aarthika_device_id', id);
    }
    return id;
  };

  const [officerAuth, setOfficerAuth] = useState(() => {
    const saved = localStorage.getItem('aarthika_staff_auth');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { loggedIn: false, userId: '', password: '', staffName: '' };
  });

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });

  const verifyAuthSentinel = async (currentAuth) => {
    if (!currentAuth.loggedIn) return false;
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentAuth.userId, action: 'check', deviceId })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        localStorage.removeItem('aarthika_staff_auth');
        setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
        showToast(`SECURITY ALERT: ${data.reason || 'Access Revoked'}.`, 'error');
        return false;
      }
      return true;
    } catch (err) {
      return true;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginForm.userId, password: loginForm.password, action: 'login', deviceId })
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        const newAuth = {
          loggedIn: true,
          userId: loginForm.userId,
          password: loginForm.password,
          staffName: data.staffName
        };
        localStorage.setItem('aarthika_staff_auth', JSON.stringify(newAuth));
        setOfficerAuth(newAuth);
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setAuthError('Network error. Please check connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aarthika_staff_auth');
    setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
  };

  // Face Scan Models state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingStatus, setModelLoadingStatus] = useState("INITIALIZING SECURE ENGINE...");
  const [customFaceNet, setCustomFaceNet] = useState(null);

  const getCachedModelUrl = async (setStatus) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AarthikaBiometricDB', 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models');
        }
      };
      
      request.onsuccess = async (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        const getReq = store.get('facenet_512');
        
        getReq.onsuccess = async () => {
          if (getReq.result) {
            setStatus("LOADING BIOMETRIC MODEL FROM INSTANT LOCAL CACHE...");
            const blob = new Blob([getReq.result], { type: 'application/octet-stream' });
            resolve(URL.createObjectURL(blob));
          } else {
            setStatus("DOWNLOADING 47MB BIOMETRIC MODEL... (MAY TAKE 10-30 SECONDS)");
            try {
              const response = await fetch('/facenet_512.tflite');
              if (!response.ok) throw new Error("Failed to fetch model");
              const buffer = await response.arrayBuffer();
              
              const writeTx = db.transaction(['models'], 'readwrite');
              const writeStore = writeTx.objectStore('models');
              writeStore.put(buffer, 'facenet_512');
              
              const blob = new Blob([buffer], { type: 'application/octet-stream' });
              resolve(URL.createObjectURL(blob));
            } catch (err) {
              reject(err);
            }
          }
        };
        getReq.onerror = () => reject(getReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  };

  useEffect(() => {
    const loadScript = async () => {
      if (!window.faceapi) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
      } catch (err) {
        console.error("Failed to load face-api models", err);
      }
      
      try {
        setModelLoadingStatus("DOWNLOADING TENSORFLOW...");
        if (!window.tf) {
          const tfScript = document.createElement('script');
          tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
          document.body.appendChild(tfScript);
          await new Promise((resolve, reject) => { 
            tfScript.onload = resolve; 
            tfScript.onerror = () => reject(new Error("Failed to load tf.min.js"));
          });
        }
        
        setModelLoadingStatus("DOWNLOADING TFLITE ENGINE...");
        if (!window.tflite) {
          const tfliteScript = document.createElement('script');
          tfliteScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js';
          document.body.appendChild(tfliteScript);
          await new Promise((resolve, reject) => { 
            tfliteScript.onload = resolve; 
            tfliteScript.onerror = () => reject(new Error("Failed to load tf-tflite.min.js"));
          });
        }
        
        const modelUrl = await getCachedModelUrl(setModelLoadingStatus);
        window.tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/');
        const tfliteModel = await window.tflite.loadTFLiteModel(modelUrl);
        setCustomFaceNet(tfliteModel);
        setModelLoadingStatus("MODELS LOADED SUCCESSFULLY");
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load custom TFLite FaceNet 512", err);
        setModelLoadingStatus("ERROR: " + err.message);
      }
    };
    loadScript();
  }, []);

  const [liveRates, setLiveRates] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (officerAuth.loggedIn) {
      verifyAuthSentinel(officerAuth);
      fetch('/api/metal-rates')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setLiveRates(data);
        })
        .catch(console.error);

      // Fetch existing customers and their items — keep FLAT, do NOT group
      fetch('/api/jewellery-sales')
        .then(res => res.json())
        .then(data => {
           if (data.data) {
             setCustomers(data.data); // Each element is one transaction row
           }
        })
        .catch(console.error);
    }
  }, [officerAuth.loggedIn]);

  // Terminal State
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'manual'
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null); // one flat transaction row
  const [selectedItems, setSelectedItems] = useState([]); // array of indexes from that transaction
  const [isFaceScanning, setIsFaceScanning] = useState(false);

  // Manual Form State
  const [manualCustomer, setManualCustomer] = useState({
    name: '', phone: '', village: ''
  });
  
  const [manualItems, setManualItems] = useState([
    { name: '', weight: '', purity: '', metalType: 'Gold' }
  ]);
  const [finalValueInput, setFinalValueInput] = useState('');

  // Common Media State
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [jewelleryPhoto, setJewelleryPhoto] = useState('');
  const [faceVectorStr, setFaceVectorStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Face Scan Logic with 512D
  const handleFaceScanSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!modelsLoaded || !window.faceapi || !customFaceNet) {
      return showToast("AI Models not loaded yet. Please wait.", "error");
    }

    setIsFaceScanning(true);
    setSearchQuery('Scanning face...');
    setSearchResults([]);

    try {
      // IDENTICAL image preprocessing to Passbook SearchGrid.jsx
      const bmp = await window.createImageBitmap(file);
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      let width = bmp.width;
      let height = bmp.height;
      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // same as passbook
      
      const normalizedImg = new Image();
      normalizedImg.onload = async () => {
        const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 });
        try {
          // 1. Detect face bounding box
          const detection = await window.faceapi.detectSingleFace(normalizedImg, options);
          if (!detection) {
            setSearchQuery('');
            setIsFaceScanning(false);
            return showToast("No face detected in photo. Try again.", "error");
          }
          
          // 2. Crop face for TFLite model (identical to passbook)
          const box = detection.box;
          const faceCanvas = document.createElement('canvas');
          faceCanvas.width = 160;
          faceCanvas.height = 160;
          const faceCtx = faceCanvas.getContext('2d');
          faceCtx.drawImage(
            normalizedImg,
            box.x, box.y, box.width, box.height,
            0, 0, 160, 160
          );
          
          // 3. Extract 512D vector (identical to passbook)
          let tensor = window.tf.browser.fromPixels(faceCanvas);
          tensor = window.tf.cast(tensor, 'float32').sub(127.5).div(127.5).expandDims(0);
          const output = customFaceNet.predict(tensor);
          const rawVectorArray = Array.from(output.dataSync());
          tensor.dispose();
          output.dispose();
          
          // 4. L2 Normalization (identical to passbook)
          let sumSq = 0;
          for (let i = 0; i < rawVectorArray.length; i++) sumSq += rawVectorArray[i] * rawVectorArray[i];
          const magnitude = Math.sqrt(sumSq) || 1;
          const vectorArray = rawVectorArray.map(val => val / magnitude);
          const liveDescriptor = new Float32Array(vectorArray);
          setFaceVectorStr(vectorArray.join(','));
          setCustomerPhoto(compressedBase64);
          
          // 5. Match against EVERY transaction row (same threshold as passbook: < 1.0)
          const allMatches = [];
          customers.forEach(txn => {
            if (!txn.faceVector || !txn.faceVector.includes(',')) return;
            const storedArray = txn.faceVector.split(',').map(Number);
            if (storedArray.length !== 512) return;
            const storedDescriptor = new Float32Array(storedArray);
            const dist = window.faceapi.euclideanDistance(liveDescriptor, storedDescriptor);
            if (dist < 1.0) { // same strict threshold as passbook
              allMatches.push({ ...txn, _faceDistance: dist });
            }
          });
          
          // Sort by closest match first
          allMatches.sort((a, b) => a._faceDistance - b._faceDistance);

          setSearchQuery('');
          if (allMatches.length > 0) {
            setSearchResults(allMatches);
            showToast(`${allMatches.length} match(es) found!`, "success");
          } else {
            showToast("No matching customer found.", "error");
          }
        } catch(err) {
          console.error(err);
          setSearchQuery('');
          showToast("Face scan failed: " + err.message, "error");
        }
        setIsFaceScanning(false);
      };
      normalizedImg.src = compressedBase64;

    } catch(err) {
      console.error(err);
      setSearchQuery('');
      showToast("Face scan failed.", "error");
      setIsFaceScanning(false);
    }
  };

  const handleTextSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const lowerQ = q.toLowerCase();
    // Return all matching transaction rows individually
    const results = customers.filter(txn => 
      (txn.customerName && txn.customerName.toLowerCase().includes(lowerQ)) ||
      (txn.phone && txn.phone.toLowerCase().includes(lowerQ)) ||
      (txn.village && txn.village.toLowerCase().includes(lowerQ))
    );
    setSearchResults(results);
  };

  const handleSelectTransaction = (txn) => {
    setSelectedTransaction(txn);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedItems([]);
  };

  const handleToggleItem = (index) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(index);
      
      if (isSelected) {
        // Remove from manualItems
        setManualItems(currentItems => currentItems.filter(item => item.originalIndex !== index));
        return prev.filter(i => i !== index);
      } else {
        // Add to manualItems
        if (manualItems.length >= 6) {
          showToast('Maximum 6 items allowed.', 'error');
          return prev;
        }
        
        const item = selectedTransaction.items[index];
        const name = item.name || '';
        const isSilv = name.toLowerCase().includes('silver');
        
        const newItem = {
          name: name,
          weight: parseWeight(item.weight),
          purity: parsePurity(item.purity),
          metalType: isSilv ? 'Silver' : 'Gold',
          originalIndex: index
        };
        
        // Remove the empty default item if it's the only one and empty
        if (manualItems.length === 1 && !manualItems[0].name && !manualItems[0].weight) {
          setManualItems([newItem]);
        } else {
          setManualItems(currentItems => [...currentItems, newItem]);
        }
        
        return [...prev, index];
      }
    });
  };

  const handleAddManualItem = () => {
    if (manualItems.length < 6) {
      setManualItems([...manualItems, { name: '', weight: '', purity: '', metalType: 'Gold' }]);
    } else {
      showToast('Maximum 6 items allowed.', 'error');
    }
  };

  const handleRemoveManualItem = (index) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const updateManualItem = (index, field, value) => {
    const newItems = [...manualItems];
    newItems[index][field] = value;
    setManualItems(newItems);
  };

  // Generic Camera Capture for Record Keeping (also generates Face Vector for customer photo)
  const handleGenericPhotoCapture = async (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const bmp = await window.createImageBitmap(file);
        const canvas = document.createElement('canvas');
        let width = bmp.width;
        let height = bmp.height;
        if (width > height) {
          if (width > 800) { height *= 800 / width; width = 800; }
        } else {
          if (height > 800) { width *= 800 / height; height = 800; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0, width, height);
        setter(canvas.toDataURL('image/jpeg', 0.7));

        if (setter === setCustomerPhoto && modelsLoaded && customFaceNet && window.faceapi) {
          try {
            showToast("Generating face scan...", "success");
            const detections = await window.faceapi.detectAllFaces(canvas, new window.faceapi.TinyFaceDetectorOptions());
            if (detections && detections.length > 0) {
              const box = detections[0].box;
              const faceCanvas = document.createElement('canvas');
              faceCanvas.width = 160;
              faceCanvas.height = 160;
              const fctx = faceCanvas.getContext('2d');
              fctx.drawImage(
                canvas,
                box.x, box.y, box.width, box.height,
                0, 0, 160, 160
              );
              let tensor = window.tf.browser.fromPixels(faceCanvas);
              tensor = window.tf.cast(tensor, 'float32').sub(127.5).div(127.5).expandDims(0);
              const output = customFaceNet.predict(tensor);
              const rawVectorArray = Array.from(output.dataSync());
              tensor.dispose();
              output.dispose();
              
              let sumSq = 0;
              for (let i = 0; i < rawVectorArray.length; i++) sumSq += rawVectorArray[i] * rawVectorArray[i];
              const magnitude = Math.sqrt(sumSq) || 1;
              const vectorArray = rawVectorArray.map(val => val / magnitude);
              
              setFaceVectorStr(vectorArray.join(','));
              showToast("Face vector generated successfully", "success");
            } else {
              showToast("No face detected in customer photo. Please retake if possible.", "warning");
            }
          } catch (err) {
            console.error("Face extraction error:", err);
            showToast("Failed to generate face vector", "error");
          }
        }
      } catch(err) {
        console.error(err);
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // Compute values
  let calculatedDescription = '';
  let calculatedWeight = 0;
  let calculatedPurity = 0;
  let suggestedValuation = 0;
  let goldWeightCalc = 0;
  let silverWeightCalc = 0;
  const parsePurity = (val) => {
    if (!val) return 0;
    const str = String(val).toUpperCase().replace(/%/g, '').trim();
    if (str.includes('K')) {
      const k = parseFloat(str.replace('K', ''));
      return (k / 24) * 100;
    }
    return parseFloat(str) || 0;
  };

  const parseWeight = (val) => {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
  };

  calculatedDescription = manualItems.map(i => `${i.metalType} ${i.name}`).join(', ');
  
  manualItems.forEach(i => {
    const w = parseWeight(i.weight);
    const p = parsePurity(i.purity);
    calculatedWeight += w;
    if (i.metalType === 'Silver') silverWeightCalc += w;
    else goldWeightCalc += w;
    const rate = i.metalType === 'Silver' ? (liveRates?.silverScrapRate || 0) : (liveRates?.goldScrapRate || 0);
    suggestedValuation += (w * rate * (p / 100));
  });

  if (manualItems.length > 0) {
    calculatedPurity = manualItems.reduce((acc, i) => acc + parsePurity(i.purity), 0) / manualItems.length;
  }


  // Determine final value (use manual input if provided, otherwise suggested)
  const finalAgreedValue = Number(finalValueInput) || Math.round(suggestedValuation) || 0;

  const handleSubmit = async () => {
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

    setIsSubmitting(true);
    try {
      const invoiceNo = 'OLD-' + Math.floor(1000 + Math.random() * 9000);
      
      // Build full items list for receipt
      let purchasedItems = [];
      if (activeTab === 'search' && selectedTransaction) {
        purchasedItems = selectedItems.map(i => {
          const item = selectedTransaction.items[i];
          const name = (item?.name || '').toLowerCase();
          return {
            name: item?.name || '',
            weight: parseWeight(item?.weight),
            purity: parsePurity(item?.purity),
            metalType: name.includes('silver') ? 'Silver' : 'Gold',
          };
        });
      } else {
        purchasedItems = manualItems.map(i => ({
          name: i.name,
          weight: parseWeight(i.weight),
          purity: parsePurity(i.purity),
          metalType: i.metalType,
        }));
      }

      const payload = {
        invoiceNo,
        date: new Date().toLocaleDateString('en-IN'),
        officerName: officerAuth.staffName,
        customerName: activeTab === 'search' ? selectedTransaction.customerName : manualCustomer.name,
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

      // Generate Silent PDF for Vault Upload
      try {
        showToast("Generating secure vault PDF...", "success");
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '0';
        tempDiv.style.left = '0';
        tempDiv.style.zIndex = '-50';
        document.body.appendChild(tempDiv);
        
        const { createRoot } = await import('react-dom/client');
        const OldJewelleryPrint = (await import('./OldJewelleryPrint')).default;
        const root = createRoot(tempDiv);
        root.render(React.createElement(OldJewelleryPrint, { dataProp: payload, silentMode: true }));
        
        await new Promise(resolve => setTimeout(resolve, 800)); // allow render time
        
        const element = document.getElementById('actual-receipt-content');
        if (element) {
          const opt = {
            margin: 0,
            filename: `${invoiceNo}_Old_Jewellery.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1050 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true }
          };
          const base64Pdf = await html2pdf().set(opt).from(element).output('datauristring');
          payload.vaultPdfFile = base64Pdf.split(',')[1];
        }
        root.unmount();
        document.body.removeChild(tempDiv);
      } catch (err) {
        console.error("Silent PDF Generation Error", err);
      }

      const res = await fetch('/api/old-jewellery-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast('Purchase Logged Successfully!', 'success');
        
        // Save for printing
        localStorage.setItem('aarthika_old_invoice', JSON.stringify({
          ...payload,
          customerPhoto: customerPhoto // keep full data url for print preview
        }));

        // Reset
        setManualCustomer({ name: '', phone: '', village: '' });
        setManualItems([{ name: '', weight: '', purity: '', metalType: 'Gold' }]);
        setFinalValueInput('');
        setCustomerPhoto('');
        setJewelleryPhoto('');
        setFaceVectorStr('');
        setSelectedTransaction(null);
        setSelectedItems([]);
        
        navigate('/jewellery/old-purchase/print');
      } else {
        showToast(data.error || 'Failed to submit', 'error');
      }
    } catch(err) {
      showToast('Network error', 'error');
    }
    setIsSubmitting(false);
  };

  if (!officerAuth.loggedIn) {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col font-inter">
        <OfficerHeader />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-[#0D0D14]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
             <h2 className="text-2xl font-black text-white mb-6 tracking-tight text-center">Officer Login</h2>
             {authError && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 font-medium text-center">{authError}</div>}
             <form onSubmit={handleLogin} className="space-y-4 relative z-10">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Passbook ID</label>
                 <input type="text" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 transition-colors font-medium" required />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vault Key</label>
                 <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 transition-colors font-medium" required />
               </div>
               <button type="submit" disabled={authLoading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all mt-4">
                 {authLoading ? 'VERIFYING...' : 'AUTHORIZE ACCESS'}
               </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A] text-white flex flex-col font-inter overflow-x-hidden">
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} onAuditRecordsClick={() => setIsAuditModalOpen(true)} />
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-fade-in-up flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100' : 'bg-red-950/80 border-red-500/30 text-red-100'
        }`}>
           {toast.type === 'success' ? (
             <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
           ) : (
             <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           )}
           <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Data Entry */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-4 mb-2">
            <button 
              onClick={() => { setActiveTab('search'); setSelectedTransaction(null); setSearchResults([]); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'search' ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)] text-white' : 'bg-[#0D0D14] border border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              SEARCH EXISTING CUSTOMER
            </button>
            <button 
              onClick={() => { setActiveTab('manual'); setSelectedTransaction(null); setSearchResults([]); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'manual' ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)] text-white' : 'bg-[#0D0D14] border border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              MANUAL ENTRY (NEW)
            </button>
          </div>

          {activeTab === 'search' && !selectedTransaction && (
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
               <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 Lookup Customer
               </h3>
               
               <div className="flex gap-4">
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Search by Name, Phone, or Village..." 
                      value={searchQuery}
                      onChange={handleTextSearch}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium placeholder-gray-600"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 
                 <input type="file" accept="image/*" capture="environment" id="face-search" className="hidden" onChange={handleFaceScanSearch} />
                 <button 
                   onClick={() => document.getElementById('face-search').click()}
                   disabled={isFaceScanning || !modelsLoaded}
                   className="bg-white/5 hover:bg-white/10 border border-rose-500/30 hover:border-rose-500 rounded-xl px-6 flex flex-col items-center justify-center gap-1 transition-all"
                 >
                   {isFaceScanning ? (
                     <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                       <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Face Scan</span>
                     </>
                   )}
                 </button>
               </div>

               {/* Search Results - show individual transactions */}
               {searchResults.length > 0 && (
                 <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
                   {searchResults.map((txn, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => handleSelectTransaction(txn)}
                       className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/40 cursor-pointer transition-colors"
                     >
                       <div className="flex justify-between items-start">
                         <div>
                           <div className="font-bold text-white">{txn.customerName}</div>
                           <div className="text-xs text-gray-400">{txn.village} • {txn.phone}</div>
                           <div className="text-[10px] text-rose-400 font-bold mt-1 uppercase tracking-wider">
                             {txn.date} {txn.invoiceNo ? `• Inv: ${txn.invoiceNo}` : ''} • {txn.items.length} item(s)
                           </div>
                         </div>
                         <svg className="w-5 h-5 text-gray-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'search' && selectedTransaction && (
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-1">Selected Transaction</h3>
                   <div className="text-2xl font-black text-white">{selectedTransaction.customerName}</div>
                   <div className="text-sm text-gray-400 font-medium">{selectedTransaction.village} • {selectedTransaction.phone}</div>
                   <div className="text-xs text-rose-400 font-bold mt-1">
                     {selectedTransaction.date} {selectedTransaction.invoiceNo ? `• Invoice: ${selectedTransaction.invoiceNo}` : ''}
                   </div>
                 </div>
                 <button onClick={() => { setSelectedTransaction(null); setSelectedItems([]); }} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-bold text-gray-300">Change</button>
               </div>

               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Items Purchased in this Invoice — select the ones they want to sell back</h4>
               {(!selectedTransaction.items || selectedTransaction.items.length === 0) ? (
                 <div className="bg-white/5 rounded-xl p-4 text-center text-sm text-gray-400">No items found for this transaction.</div>
               ) : (
                 <div className="space-y-2">
                   {selectedTransaction.items.map((item, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => handleToggleItem(idx)}
                       className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedItems.includes(idx) ? 'bg-rose-500/10 border-rose-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                     >
                       <div className="flex items-center gap-4">
                         <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${selectedItems.includes(idx) ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-600'}`}>
                           {selectedItems.includes(idx) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="font-bold text-white text-sm">{item.name}</div>
                           <div className="text-xs text-gray-400">Wt: {item.weight}g • Purity: {item.purity}%</div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
               
               {/* Customer Details Section */}
               <div>
                 <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   New Customer Details
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
                      <input type="text" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number</label>
                      <input type="text" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                   </div>
                   <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Village / City</label>
                      <input type="text" value={manualCustomer.village} onChange={e => setManualCustomer({...manualCustomer, village: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                   </div>
                </div>
              </div>
            </div>
           )}

           {/* Items Section (Always visible) */}
           <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8 mt-6">
             <div>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase flex items-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                     Item Assessment
                   </h3>
                   <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">{manualItems.length} / 6 ITEMS</span>
                 </div>

                 <div className="space-y-4">
                   {manualItems.map((item, index) => (
                     <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative">
                       {manualItems.length > 1 && (
                         <button onClick={() => handleRemoveManualItem(index)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-lg hover:bg-rose-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                       )}
                       
                       <div className="flex gap-4 mb-4">
                         <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                           <input type="radio" name={`metal-${index}`} checked={item.metalType === 'Gold'} onChange={() => updateManualItem(index, 'metalType', 'Gold')} className="accent-amber-500 w-4 h-4" />
                           <span className={item.metalType === 'Gold' ? 'text-amber-400' : 'text-gray-500'}>Gold</span>
                         </label>
                         <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                           <input type="radio" name={`metal-${index}`} checked={item.metalType === 'Silver'} onChange={() => updateManualItem(index, 'metalType', 'Silver')} className="accent-gray-300 w-4 h-4" />
                           <span className={item.metalType === 'Silver' ? 'text-gray-300' : 'text-gray-500'}>Silver</span>
                         </label>
                       </div>

                       <div className="space-y-4">
                         <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Item Description</label>
                            <input type="text" placeholder="e.g. Chain, Ring..." value={item.name} onChange={e => updateManualItem(index, 'name', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gross Weight (g)</label>
                              <input type="number" step="0.01" value={item.weight} onChange={e => updateManualItem(index, 'weight', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Melting Purity (%)</label>
                              <input type="number" step="0.1" value={item.purity} onChange={e => updateManualItem(index, 'purity', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors font-medium" />
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}

                   {manualItems.length < 6 && (
                     <button onClick={handleAddManualItem} className="w-full py-4 border-2 border-dashed border-white/10 hover:border-rose-500/50 rounded-xl text-gray-400 font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                       ADD ANOTHER ITEM
                     </button>
                   )}
                 </div>
               </div>
            </div>

          {/* Security Vault Photos (Required for both modes) */}
          <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-sm font-black text-rose-500 tracking-widest uppercase mb-6 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               Security Vault Photos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Customer Photo</label>
                <input type="file" accept="image/*" capture="environment" id="cam-cust" className="hidden" onChange={(e) => handleGenericPhotoCapture(e, setCustomerPhoto)} />
                <div onClick={() => document.getElementById('cam-cust').click()} className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${customerPhoto ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-rose-500/50 bg-white/5'}`}>
                  {customerPhoto ? <img src={customerPhoto} className="w-full h-full object-cover" /> : <div className="text-gray-500 flex flex-col items-center"><svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span className="text-[10px] font-bold uppercase">Tap to Capture</span></div>}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Old Jewellery Item</label>
                <input type="file" accept="image/*" capture="environment" id="cam-jewel" className="hidden" onChange={(e) => handleGenericPhotoCapture(e, setJewelleryPhoto)} />
                <div onClick={() => document.getElementById('cam-jewel').click()} className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${jewelleryPhoto ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-rose-500/50 bg-white/5'}`}>
                  {jewelleryPhoto ? <img src={jewelleryPhoto} className="w-full h-full object-cover" /> : <div className="text-gray-500 flex flex-col items-center"><svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span className="text-[10px] font-bold uppercase">Tap to Capture</span></div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Submit */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            
            <div className="bg-[#0D0D14] border border-white/10 rounded-2xl p-6 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-black text-white tracking-widest uppercase">Financial Summary</h3>
                 <div className="flex flex-col gap-1">
                   <div className="bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-400 px-2 py-0.5 rounded">
                      Gold Rate: ₹{liveRates?.goldScrapRate || 0}/g
                   </div>
                   <div className="bg-gray-500/10 border border-gray-500/30 text-[9px] font-bold text-gray-300 px-2 py-0.5 rounded">
                      Silver Rate: ₹{liveRates?.silverScrapRate || 0}/g
                   </div>
                 </div>
               </div>
               
               <div className="space-y-2.5 text-sm border-b border-white/10 pb-4 mb-4">
                  {goldWeightCalc > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400/80 font-medium text-xs">Gold Weight</span>
                      <div className="text-right">
                        <span className="text-white font-bold">{goldWeightCalc.toFixed(2)} g</span>
                        <span className="text-amber-400/60 text-[10px] ml-1">@ ₹{liveRates?.goldScrapRate || 0}/g</span>
                      </div>
                    </div>
                  )}
                  {silverWeightCalc > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400/80 font-medium text-xs">Silver Weight</span>
                      <div className="text-right">
                        <span className="text-white font-bold">{silverWeightCalc.toFixed(2)} g</span>
                        <span className="text-gray-400/60 text-[10px] ml-1">@ ₹{liveRates?.silverScrapRate || 0}/g</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/5 pt-2">
                    <span className="text-gray-400 font-medium">Total Gross Weight</span>
                    <span className="text-white font-bold">{calculatedWeight ? `${calculatedWeight.toFixed(2)} g` : '0 g'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Avg. Purity</span>
                    <span className="text-white font-bold">{calculatedPurity ? `${calculatedPurity.toFixed(1)}%` : '0 %'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/5">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">Suggested Valuation</span>
                    <span className="text-emerald-400 font-black">₹{Math.round(suggestedValuation).toLocaleString('en-IN')}</span>
                  </div>
               </div>

               <div>
                 <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Final Agreed Value (₹)</label>
                 <input 
                   type="number" 
                   placeholder={Math.round(suggestedValuation).toString()}
                   value={finalValueInput}
                   onChange={e => setFinalValueInput(e.target.value)}
                   className="w-full bg-[#05050A] border border-rose-500/30 rounded-xl px-4 py-4 text-white text-2xl font-black focus:outline-none focus:border-rose-500 transition-colors"
                 />
               </div>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className={`w-full font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 text-sm tracking-wide ${isSubmitting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {isSubmitting ? 'PROCESSING...' : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  SAVE & GENERATE SLIP
                </>
              )}
            </button>
            <p className="text-[9px] text-gray-600 text-center font-medium uppercase tracking-widest leading-relaxed">
              Generates A4 Vault Record &<br/>A5 Customer Receipt
            </p>
          </div>
        </div>
      </div>
      {/* Audit Records Modal */}
      <AuditRecordsModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
        customers={customers} 
        modelsLoaded={modelsLoaded} 
        customFaceNet={customFaceNet} 
      />
    </div>
  );
}
