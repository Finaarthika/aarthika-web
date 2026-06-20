import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import logoIcon from '../../assets/4.png';
import logoTextUrl from '../../assets/Aarthika (1).png';

const StaffHeader = ({ staffName, onLogout }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-aarthikaBlue py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    {/* Abstract background glows */}
    <div className="absolute top-0 right-[10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none transform -translate-y-1/2"></div>
    <div className="absolute bottom-0 left-[20%] w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none transform translate-y-1/2"></div>
    
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center group cursor-default">
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur group-hover:bg-white/40 transition-all duration-500"></div>
          <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 border border-white/30 transform group-hover:scale-105 transition-all duration-300">
            <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
          </div>
        </div>
        <div className="flex flex-col">
          <img src={logoTextUrl} alt="Aarthika" className="h-6 sm:h-8 object-contain origin-left drop-shadow-md" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-blue-200 text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mt-0.5 sm:mt-1 opacity-90">Core Banking System</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 z-10">
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="text-white/60 text-xs font-medium tracking-wider uppercase">Active Staff</div>
          <div className="text-white/90 text-sm font-semibold">{staffName || 'System'}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-white/20"></div>
        <button onClick={onLogout} className="flex items-center justify-center p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors group" title="Secure Logout">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">
          <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          </div>
          <span className="text-green-400 text-[10px] sm:text-xs font-bold tracking-widest">NETWORK SECURE</span>
        </div>
      </div>
    </div>
  </div>
);

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
};

const IN_MEMORY_DB_KEY = 'aarthika_passbook_ledgers';

const getSecurePhotoUrl = (link) => {
  try {
    if (!link) return null;
    const strLink = String(link);
    if (strLink.includes('drive.google.com')) {
      const idMatch = strLink.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) return `/api/passbook-image?id=${idMatch[1]}`;
    }
    return strLink;
  } catch (e) {
    console.error("Photo URL parse error:", e);
    return null;
  }
};

export default function SearchGrid() {
  const [view, setView] = useState('SEARCH'); // 'SEARCH' | 'LEDGER' | 'CREATE'
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fullDatabaseRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  const getDeviceId = () => {
    let id = localStorage.getItem('aarthika_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('aarthika_device_id', id);
    }
    return id;
  };

  // Authentication State
  const [staffAuth, setStaffAuth] = useState(() => {
    const saved = localStorage.getItem('aarthika_staff_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.loggedIn && parsed.loginTimestamp) {
           const hoursElapsed = (Date.now() - parsed.loginTimestamp) / (1000 * 60 * 60);
           if (hoursElapsed >= 8) {
              localStorage.removeItem('aarthika_staff_auth');
              return { loggedIn: false, userId: '', password: '', staffName: '' };
           }
        }
        return parsed;
      } catch (e) {}
    }
    return { loggedIn: false, userId: '', password: '', staffName: '' };
  });

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });

  // The Sentinel
  const verifyAuthSentinel = async (currentAuth) => {
    if (!currentAuth.loggedIn) return false;
    
    // 1. Local 8-Hour Check
    if (currentAuth.loginTimestamp) {
      const hoursElapsed = (Date.now() - currentAuth.loginTimestamp) / (1000 * 60 * 60);
      if (hoursElapsed >= 8) {
        localStorage.removeItem('aarthika_staff_auth');
        setStaffAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
        alert(`SECURITY ALERT: Session Expired (8 Hour Limit). Please log in again.`);
        setView('SEARCH');
        return false;
      }
    }

    // 2. Hardware Binding & Revocation Check
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentAuth.userId, 
          action: 'check',
          deviceId 
        })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        localStorage.removeItem('aarthika_staff_auth');
        setStaffAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
        alert(`SECURITY ALERT: ${data.reason || 'Access Revoked'}. You have been forcibly logged out.`);
        setView('SEARCH'); 
        return false;
      }
      return true;
    } catch (err) {
      console.error("Sentinel check failed:", err);
      return true;
    }
  };

  // Run Sentinel on every view change
  useEffect(() => {
    if (staffAuth.loggedIn) {
      verifyAuthSentinel(staffAuth);
    }
  }, [view, staffAuth.loggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/passbook-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, action: 'login', deviceId })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setAuthError(data.reason || 'Invalid Credentials');
      } else {
        const newAuth = { 
          loggedIn: true, 
          userId: data.userId, 
          password: loginForm.password, 
          staffName: data.staffName,
          loginTimestamp: Date.now()
        };
        setStaffAuth(newAuth);
        localStorage.setItem('aarthika_staff_auth', JSON.stringify(newAuth));
        setLoginForm({ userId: '', password: '' });
      }
    } catch (err) {
      setAuthError('Connection error. Try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aarthika_staff_auth');
    setStaffAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
  };

  // Global Escape Key Listener for Power Users
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomedImage) {
          setZoomedImage(null);
        } else if (view !== 'SEARCH') {
          setView('SEARCH');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, zoomedImage]);

  // Auto-focus search bar when returning to SEARCH view
  useEffect(() => {
    if (view === 'SEARCH' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [view]);

  // Biometrics State
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState('');

  // Ledger state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [netBalance, setNetBalance] = useState('0.00');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Print state
  const [printTransaction, setPrintTransaction] = useState(null);
  
  // Transaction state
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionMsg, setTransactionMsg] = useState({ type: '', text: '' });

  // Create state
  const [newCustomer, setNewCustomer] = useState({
    customerName: '', fathersName: '', village: '', phone: '', aadharId: ''
  });
  const [capturedVector, setCapturedVector] = useState('');
  const [capturedImageBase64, setCapturedImageBase64] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [customFaceNet, setCustomFaceNet] = useState(null);
  const [modelLoadingStatus, setModelLoadingStatus] = useState("INITIALIZING SECURE ENGINE...");

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

  // --- INIT FACE-API & TFLITE ---
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
  // --- API LOGIC ---
  useEffect(() => {
    if (view === 'SEARCH') {
      fetchCustomers('');
    }
  }, [view]);

  const fetchCustomers = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/passbook-search?search=${encodeURIComponent(query)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      const data = body.data || [];
      setCustomers(data);
      if (query === '') {
        fullDatabaseRef.current = data;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const openLedger = async (customer) => {
    setSelectedCustomer(customer);
    setView('LEDGER');
    setTransactionMsg({ type: '', text: '' });
    setCurrentPage(1);
    await fetchLedger(customer.accountNumber);
  };


  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState(''); // 'DEPOSIT' | 'WITHDRAWAL'
  const [txAmount, setTxAmount] = useState('');
  const [txMethod, setTxMethod] = useState('CASH'); // 'CASH' | 'UPI'
  const [txFormImage, setTxFormImage] = useState(null);
  const [txPersonImage, setTxPersonImage] = useState(null);

  const fetchLedger = async (accountNumber) => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/passbook-ledger?accountNumber=${encodeURIComponent(accountNumber)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setLedger(body.data || []);
      setNetBalance(body.currentNetBalance || '0.00');
    } catch (err) {
      setTransactionMsg({ type: 'error', text: `Failed to load ledger: ${err.message}` });
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleTxCameraCapture = async (e, setBase64Str) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const bmp = await window.createImageBitmap(file);
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
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
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      setBase64Str(compressedBase64);
    } catch (err) {
      console.error("Camera Capture Error:", err);
      alert("Error processing camera image.");
    }
  };

  const openTxModal = (type) => {
    setTxType(type);
    setTxAmount(type === 'DEPOSIT' ? depositAmount : withdrawAmount);
    setTxMethod('CASH');
    setTxFormImage(null);
    setTxPersonImage(null);
    setTransactionMsg({ type: '', text: '' });
    setTxModalOpen(true);
  };

  const handleTransactionSubmit = async () => {
    if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
      setTransactionMsg({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }
    if (!txFormImage || !txPersonImage) {
      setTransactionMsg({ type: 'error', text: 'Both Form Photo and Person Photo are required for verification.' });
      return;
    }

    setTransactionLoading(true);
    setTransactionMsg({ type: '', text: 'Processing and uploading secure images... Please wait.' });

    try {
      const res = await fetch('/api/passbook-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: selectedCustomer.accountNumber,
          type: txType,
          amount: txAmount,
          method: txMethod,
          formImage: txFormImage,
          personImage: txPersonImage
        })
      });
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      setTransactionMsg({ type: 'success', text: `SUCCESS: ${txType} of ₹${txAmount} via ${txMethod} completed. New Balance: ${body.newBalance}` });
      if (txType === 'DEPOSIT') setDepositAmount('');
      if (txType === 'WITHDRAWAL') setWithdrawAmount('');
      setTxModalOpen(false);
      
      await fetchLedger(selectedCustomer.accountNumber);
    } catch (err) {
      setTransactionMsg({ type: 'error', text: `ERROR: ${err.message}` });
    } finally {
      setTransactionLoading(false);
    }
  };

  // --- BIOMETRIC SEARCH ---
  const handleFaceScanSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!modelsLoaded || !window.faceapi) {
      alert("Biometric models are still loading. Please wait a moment.");
      return;
    }

    setBiometricStatus("SCANNING BIOMETRICS...");
    try {
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
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
      
      const normalizedImg = new Image();
      normalizedImg.onload = async () => {
        const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 });
        try {
          // 1. Detect physical face bounding box
          const detection = await window.faceapi.detectSingleFace(normalizedImg, options);
                                    
          if (!detection) {
            setBiometricStatus("");
            alert("No face detected in photo. Please try again.");
            return;
          }
          
          setBiometricStatus("COMPUTING 512D TENSOR...");
          
          // 2. Crop face for custom TFLite model
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
          
          // 3. Extract 512-dimensional vector via TensorFlow
          let tensor = window.tf.browser.fromPixels(faceCanvas);
          tensor = window.tf.cast(tensor, 'float32').sub(127.5).div(127.5).expandDims(0);
          const output = customFaceNet.predict(tensor);
          const rawVectorArray = Array.from(output.dataSync());
          tensor.dispose();
          output.dispose();
          
          // Apply mathematical L2 Normalization to place vector on a unit hypersphere
          let sumSq = 0;
          for (let i = 0; i < rawVectorArray.length; i++) sumSq += rawVectorArray[i] * rawVectorArray[i];
          const magnitude = Math.sqrt(sumSq) || 1;
          const vectorArray = rawVectorArray.map(val => val / magnitude);
          
          const liveDescriptor = new Float32Array(vectorArray);
          
          setBiometricStatus("MATCHING NORMALIZED TENSOR IN DATABASE...");
          const matchedCustomers = [];
          
          const databaseToSearch = fullDatabaseRef.current.length > 0 ? fullDatabaseRef.current : customers;
          
          databaseToSearch.forEach(c => {
            if (c.faceVector && c.faceVector.includes(',')) {
              const storedArray = c.faceVector.split(',').map(Number);
              if (storedArray.length === 512) {
                const storedDescriptor = new Float32Array(storedArray);
                const dist = window.faceapi.euclideanDistance(liveDescriptor, storedDescriptor);
                if (dist < 1.0) { // 512D vectors are longer, Euclidean distance threshold is naturally higher
                  matchedCustomers.push({ ...c, faceDistance: dist });
                }
              }
            }
          });
          
          if (matchedCustomers.length > 0) {
            matchedCustomers.sort((a, b) => a.faceDistance - b.faceDistance);
            setCustomers(matchedCustomers);
            setBiometricStatus(`FOUND ${matchedCustomers.length} HIGH-ACCURACY MATCHES (512D)`);
            setCurrentPage(1);
          } else {
            setBiometricStatus("");
            alert("No matching profiles found in secure database.");
          }
        } catch (err) {
          console.error(err);
          setBiometricStatus("");
          alert("Error analyzing face.");
        }
      };
      normalizedImg.src = compressedBase64;
    } catch (err) {
      console.error(err);
      setBiometricStatus("");
      alert("Error processing camera image.");
    }
    
    e.target.value = null; // Reset file input
  };

  // --- ACCOUNT CREATION ---
  const handleNativeCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBiometricStatus("PROCESSING IMAGE...");
    try {
      // Use modern createImageBitmap which natively parses and applies EXIF orientation
      // and safely scales down massive Android hardware photos before touching canvas
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
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
      setCapturedImageBase64(compressedBase64);
      
      if (modelsLoaded && window.faceapi) {
        setBiometricStatus("COMPUTING BIOMETRIC VECTOR...");
        
        const normalizedImg = new Image();
        normalizedImg.onload = async () => {
          const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 });
          try {
            const detection = await window.faceapi.detectSingleFace(normalizedImg, options);
            if (!detection) {
              setBiometricStatus("FACE NOT DETECTED. PLEASE RETRY.");
              setCapturedVector('');
              return;
            }
            
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
            
            let tensor = window.tf.browser.fromPixels(faceCanvas);
            tensor = window.tf.cast(tensor, 'float32').sub(127.5).div(127.5).expandDims(0);
            const output = customFaceNet.predict(tensor);
            const rawVectorArray = Array.from(output.dataSync());
            tensor.dispose();
            output.dispose();
            
            // Apply mathematical L2 Normalization to place vector on a unit hypersphere
            let sumSq = 0;
            for (let i = 0; i < rawVectorArray.length; i++) sumSq += rawVectorArray[i] * rawVectorArray[i];
            const magnitude = Math.sqrt(sumSq) || 1;
            const vectorArray = rawVectorArray.map(val => val / magnitude);
            
            const vectorStr = vectorArray.join(',');
            setCapturedVector(vectorStr);
            setBiometricStatus("512D FACE VECTOR LOCKED & SECURED.");
          } catch (err) {
            console.error(err);
            setBiometricStatus("ERROR COMPUTING 512D VECTOR.");
          }
        };
        normalizedImg.src = compressedBase64;
      } else {
        setBiometricStatus("MODELS NOT LOADED. PLEASE RETRY IN A MOMENT.");
      }
    } catch (err) {
      console.error(err);
      setBiometricStatus("ERROR PROCESSING IMAGE.");
    }
  };

  const submitNewAccount = async () => {
    if (!newCustomer.customerName || !newCustomer.phone) return alert("Name and Phone are required.");
    if (!capturedImageBase64) return alert("You must capture a photo first.");

    setCreateLoading(true);
    try {
      // 1. Generate base64 PDF to send to the secure vault
      const pdfElement = document.getElementById('pdf-template');
      const pdfBase64Str = await html2pdf().from(pdfElement).set({
        margin: [10, 10, 10, 10],
        filename: `Aarthika_Account.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).toPdf().output('datauristring');
      
      const cleanBase64 = pdfBase64Str.split(',')[1];

      // 2. Transmit to backend
      const res = await fetch('/api/passbook-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustomer.customerName,
          fathersName: newCustomer.fathersName,
          village: newCustomer.village,
          phone: newCustomer.phone,
          faceVector: capturedVector, 
          aadharId: newCustomer.aadharId,
          pdfFile: cleanBase64,
          photoFile: capturedImageBase64.split(',')[1]
        })
      });
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch (err) {
        throw new Error(`Server returned non-JSON response (likely Payload Too Large). Response: ${text.substring(0, 80)}...`);
      }
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      alert(`Account Created Successfully: ${body.accountNumber}. Opening PDF Receipt...`);
      
      // 3. Print the final local copy with the actual account number
      document.getElementById('pdf-acc-no').innerText = body.accountNumber;
      
      html2pdf().from(pdfElement).set({
        margin: [10, 10, 10, 10],
        filename: `Aarthika_Account_${body.accountNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).output('bloburl').then(function(pdfUrl) {
        window.open(pdfUrl, '_blank');
      });

      // Cleanup
      setNewCustomer({ customerName: '', fathersName: '', village: '', phone: '', aadharId: '' });
      setCapturedVector('');
      setCapturedImageBase64('');
      setView('SEARCH');

    } catch (err) {
      alert("Error creating account: " + err.message);
    } finally {
      setCreateLoading(false);
    }
  };


  // --- RENDER SCREEN 0: LOGIN ---
  if (!staffAuth.loggedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 overflow-hidden font-sans">
        {/* Decorative background elements for premium feel */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[100px]"></div>
          <div className="absolute bottom-[0%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 blur-[120px]"></div>
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-white/60 p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-blue-900/10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-full p-2 mb-6 shadow-md border border-gray-100 flex items-center justify-center">
              <img src={logoIcon} alt="Aarthika" className="w-full h-full object-contain rounded-full" />
            </div>
            <img src={logoTextUrl} alt="Aarthika" className="h-8 object-contain mb-3" />
            <div className="text-aarthikaBlue tracking-[0.2em] text-xs font-bold uppercase opacity-90">Staff Authentication Portal</div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Staff ID Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 pl-11 pr-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue focus:bg-white transition-all font-medium shadow-sm"
                  value={loginForm.userId}
                  onChange={e => setLoginForm({...loginForm, userId: e.target.value})}
                  placeholder="Enter your ID"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 pl-11 pr-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue focus:bg-white transition-all font-medium shadow-sm"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-aarthikaBlue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex justify-center items-center gap-2 text-lg"
            >
              {authLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <>Secure Login <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            256-bit Encrypted Connection
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER SCREEN 1: SEARCH ---
  if (view === 'SEARCH') {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-screen font-sans pb-16">
        <StaffHeader staffName={staffAuth.staffName} onLogout={handleLogout} />
        
        <div className="premium-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-50 rounded-lg shadow-sm border border-blue-100">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-aarthikaBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </span>
              Master Directory
            </h1>
            <button onClick={() => setView('CREATE')} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-aarthikaBlue/30 hover:-translate-y-1 transition-all duration-300 py-3 px-6 text-sm sm:text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Originate New Account
            </button>
          </div>

          {/* Epic Search Bar */}
          <div className="relative group mb-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-aarthikaBlue to-indigo-400 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
            <div className="relative bg-white premium-card p-2 sm:p-3 rounded-2xl flex flex-col sm:flex-row gap-2 items-center shadow-xl border-0">
              <div className="flex-1 w-full relative flex items-center">
                <svg className="absolute left-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  ref={searchInputRef}
                  className="w-full text-lg sm:text-xl py-4 pl-14 pr-4 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium outline-none" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder="Enter customer name, ID, or phone number..."
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={handleSearch} className="btn btn-primary px-8 py-4 sm:py-0 h-14 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto text-lg font-bold shadow-md hover:shadow-lg transition-all">
                  Search Records
                </button>
                <input type="file" accept="image/*" capture="user" id="face-search-input" onChange={handleFaceScanSearch} style={{ display: 'none' }} />
                <button 
                  onClick={() => document.getElementById('face-search-input').click()} 
                  disabled={!modelsLoaded}
                  className={`${modelsLoaded ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white border-gray-700 hover:shadow-lg' : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'} px-6 py-4 sm:py-0 h-14 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto text-lg font-bold shadow-md transition-all border`}
                >
                  <svg className={`w-6 h-6 ${modelsLoaded ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {modelsLoaded ? 'Face Scan' : 'Loading Model...'}
                </button>
              </div>
            </div>
          </div>

          {biometricStatus && <div className="text-green-600 font-medium mb-4 bg-green-50 p-3 rounded-lg border border-green-100">{biometricStatus}</div>}
          {error && <div className="text-red-600 font-medium mb-4 p-4 bg-red-50 rounded-lg border border-red-100">{error}</div>}
          {loading && <div className="text-gray-500 font-medium flex items-center gap-3 p-4"><svg className="animate-spin h-6 w-6 text-aarthikaBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Fetching Database...</div>}

          {!loading && !error && (
            <div className="premium-card overflow-hidden shadow-lg border-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200">
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Profile Image</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Customer Name</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Father's Name</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Village/Address</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider">Contact Number</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {customers.map((c, i) => (
                      <tr 
                        key={c.accountNumber || i} 
                        className="hover:bg-blue-50/60 transition-colors group cursor-pointer focus:outline-none focus:bg-blue-50/60" 
                        onClick={() => openLedger(c)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && openLedger(c)}
                      >
                        <td className="py-5 px-6">
                          {c.photoLink ? (
                            <a href={getSecurePhotoUrl(c.photoLink)} target="_blank" rel="noreferrer" className="inline-block relative shadow-sm rounded-full" onClick={(e) => e.stopPropagation()}>
                               <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white ring-2 ring-aarthikaBlue/20 hover:ring-aarthikaBlue transition-all">
                                  <img src={getSecurePhotoUrl(c.photoLink)} alt="Profile" className="w-full h-full object-cover" />
                               </div>
                            </a>
                          ) : (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white ring-2 ring-gray-100 flex items-center justify-center bg-gray-50 text-gray-300 shadow-sm">
                              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-6 font-bold text-gray-800 text-base">{c.customerName || '-'}</td>
                        <td className="py-5 px-6 text-gray-600 font-medium">{c.fathersName || '-'}</td>
                        <td className="py-5 px-6 text-gray-600 font-medium">{c.village || '-'}</td>
                        <td className="py-5 px-6 font-semibold text-gray-700 bg-gray-50/50">{c.phone || '-'}</td>
                        <td className="py-5 px-6 text-right">
                          <button className="text-aarthikaBlue font-bold hover:text-indigo-900 transition-all inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl border border-blue-100 group-hover:shadow-md">
                            View Ledger <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-500 font-medium">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            <p>No Customer Records matching query.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER SCREEN: CREATE ACCOUNT ---
  if (view === 'CREATE') {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-screen font-sans pb-16">
        <StaffHeader staffName={staffAuth.staffName} onLogout={handleLogout} />
        
        <div className="premium-container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-50 rounded-lg shadow-sm border border-blue-100 text-aarthikaBlue">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </span>
              Account Origination
            </h1>
            <button onClick={() => setView('SEARCH')} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-bold transition-all bg-white hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Cancel & Return
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="premium-card p-8 md:col-span-3 shadow-xl border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-brand"></div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                <svg className="w-6 h-6 text-aarthikaBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Applicant Details
              </h2>
              <div className="space-y-5">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label><input id="input-name" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-fname')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.customerName} onChange={e=>setNewCustomer({...newCustomer, customerName: toTitleCase(e.target.value)})} placeholder="Enter full name" autoComplete="new-password" spellCheck="false" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Father's Name</label><input id="input-fname" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-village')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.fathersName} onChange={e=>setNewCustomer({...newCustomer, fathersName: toTitleCase(e.target.value)})} placeholder="Enter father's name" autoComplete="new-password" spellCheck="false" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Residential Village</label><input id="input-village" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-phone')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.village} onChange={e=>setNewCustomer({...newCustomer, village: toTitleCase(e.target.value)})} placeholder="Enter village or district" autoComplete="new-password" spellCheck="false" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Mobile Number *</label><input id="input-phone" onKeyDown={e => e.key === 'Enter' && document.getElementById('input-aadhar')?.focus()} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.phone} onChange={e=>{const val = e.target.value.replace(/\D/g, ''); if(val.length <= 10) setNewCustomer({...newCustomer, phone: val})}} placeholder="10-digit number" autoComplete="new-password" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Gov. ID (Aadhar/Voter) *</label><input id="input-aadhar" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitNewAccount(); } }} className="input-premium shadow-sm focus:ring-aarthikaBlue/50 focus:border-aarthikaBlue" value={newCustomer.aadharId} onChange={e=>setNewCustomer({...newCustomer, aadharId: e.target.value.toUpperCase()})} placeholder="Enter ID number" autoComplete="new-password" spellCheck="false" /></div>
              </div>
            </div>

            <div className="premium-card p-8 md:col-span-2 flex flex-col items-center justify-center shadow-lg border-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-100 w-full text-center">Official Photograph</h2>
              
              <div className="w-56 h-56 rounded-full ring-8 ring-blue-50 bg-gray-50 flex items-center justify-center overflow-hidden mb-8 shadow-inner">
                {capturedImageBase64 ? (
                  <img src={capturedImageBase64} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 p-4 text-center">
                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-medium">{modelsLoaded ? "No Photo" : modelLoadingStatus}</span>
                  </div>
                )}
              </div>
              
              <label className={`btn ${modelsLoaded ? 'text-aarthikaBlue bg-blue-50 border-2 border-aarthikaBlue hover:bg-aarthikaBlue hover:text-white' : 'bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed'} flex items-center justify-center gap-2 w-full max-w-[240px] shadow-sm font-semibold transition-all`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                {modelsLoaded ? 'Open Camera' : 'Loading Models...'}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleNativeCameraCapture} 
                />
              </label>
              
              {biometricStatus && <div className="text-aarthikaBlue font-semibold mt-6 text-sm bg-blue-50 py-2 px-4 rounded-full border border-blue-100">{biometricStatus}</div>}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button className="btn btn-primary text-lg py-4 px-12 shadow-lg shadow-aarthikaBlue/30 hover:-translate-y-1 transform transition-all flex items-center justify-center gap-3 mx-auto w-full md:w-auto" onClick={submitNewAccount} disabled={createLoading}>
              {createLoading ? (
                 <><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating PDF...</>
              ) : (
                <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Submit Application</>
              )}
            </button>
          </div>

        {/* --- HIDDEN PDF TEMPLATE --- */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="pdf-template" style={{ padding: '8px', fontFamily: '"Courier New", Courier, monospace', color: '#111', backgroundColor: '#fff', width: '277mm', boxSizing: 'border-box' }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111', paddingBottom: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/assets/Aarthika_logo.png" alt="Logo" style={{ height: '40px' }} />
                <div>
                  <h1 style={{ margin: 0, fontSize: '18px', letterSpacing: '0.5px' }}>AARTHIKA FINANCE • RURAL BRANCH OPERATIONS & MICROFINANCE</h1>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 'bold' }}>OFFICIAL ACCOUNT ORIGINATION RECORD</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', padding: '4px 8px', border: '1px solid #111', fontWeight: 'bold', fontSize: '14px' }} id="pdf-acc-no">PENDING</div>
              </div>
            </div>

            {/* Applicant Details & Photo */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', width: '30%', fontWeight: 'bold' }}>Full Name:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold', fontSize: '14px' }}>{newCustomer.customerName}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Father's Name:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>{newCustomer.fathersName}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Residential Village:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>{newCustomer.village}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Contact Mobile:</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>+91 {newCustomer.phone}</td></tr>
                    <tr><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Gov. ID (Aadhar/Voter):</td><td style={{ padding: '6px 4px', borderBottom: '1px solid #ddd' }}>{newCustomer.aadharId || 'NOT PROVIDED'}</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <div style={{ border: '2px solid #00ff41', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                  {capturedImageBase64 ? (
                    <img src={capturedImageBase64} alt="Captured" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                  ) : <span style={{fontSize: '10px', color: '#94a3b8'}}>No Photo</span>}
                </div>
                <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>BIOMETRIC VERIFICATION SECURED</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #111', marginBottom: '8px' }}></div>

            {/* Formal Terms & Conditions */}
            <div style={{ fontSize: '10px', color: '#111', lineHeight: '1.3', textAlign: 'justify' }}>
              <div style={{ marginBottom: '4px' }}><strong>1. ACCOUNT VALIDITY & SECURED OPERATION:</strong> This document serves as the official registration record for account origination under Aarthika Finance Rural Branch Operations. All active ledgers are backed exclusively by deposited asset values or evaluated gold/silver collateral vectors held under branch custody.</div>
              <div style={{ marginBottom: '4px' }}><strong>2. TRANSACTIONS & PASSBOOK ACCOUNTABILITY:</strong> Deposits and withdrawals must be authenticated in person at the portal terminal via direct text lookup or matching face biometric verification metrics. Every transaction will generate an immediate running balance update logged directly into the immutable centralized master ledger sheet.</div>
              <div style={{ marginBottom: '4px' }}><strong>3. OVERDRAFT SHIELDING & LIQUIDATION BOUNDARIES:</strong> The ledger system enforces strict zero-overdraft boundaries. Withdrawal requests exceeding the current net balance will be automatically restricted and denied by the server terminal routing system.</div>
              <div><strong>4. AUDIT & ASSET CUSTODY RIGOR:</strong> Aarthika Finance retains absolute authority to freeze, audit, or review ledger operations if irregular transaction histories or unauthorized profile anomalies are captured. Collateral liquidations follow regulatory micro-lending guidelines.</div>
            </div>

            <div style={{ borderTop: '1px solid #111', marginTop: '10px', marginBottom: '20px' }}></div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #111', width: '200px', height: '20px' }}></div>
                <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 'bold' }}>Applicant Signature / Thumbprint</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #111', width: '200px', height: '20px' }}></div>
                <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 'bold' }}>Branch Manager Authorization</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '9px', color: '#555' }}>
              Generated Timestamp: {new Date().toLocaleString()} | Aarthika Financial Services - Secure Ledger System
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // --- RENDER SCREEN 2: LEDGER ---
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 min-h-screen font-sans pb-16">
      <StaffHeader staffName={staffAuth.staffName} onLogout={handleLogout} />
      
      <div className="premium-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 rounded-lg shadow-sm border border-indigo-100 text-aarthikaBlue">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </span>
            Account Ledger
          </h1>
          <button onClick={() => setView('SEARCH')} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-bold transition-all bg-white hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Close Profile
          </button>
        </div>

        {/* Customer Profile Header */}
        <div className="premium-card p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-xl border-0 relative overflow-hidden bg-white/90 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-brand"></div>
          
          <div className="flex-shrink-0 relative">
            {selectedCustomer?.photoLink ? (
              <img 
                src={getSecurePhotoUrl(selectedCustomer.photoLink)} 
                alt="Profile" 
                onClick={() => setZoomedImage(getSecurePhotoUrl(selectedCustomer.photoLink))}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-aarthikaBlue/10 shadow-md cursor-pointer hover:ring-aarthikaBlue transition-all hover:scale-105"
                title="Click to enlarge"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 ring-4 ring-gray-50">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              Customer Profile
              <span className="text-sm font-semibold bg-blue-50 text-aarthikaBlue px-3 py-1 rounded-md border border-blue-100">
                {selectedCustomer?.accountNumber}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
              <div><span className="text-gray-500 block mb-1 font-medium">Full Name</span><strong className="text-gray-800 text-base">{selectedCustomer?.customerName}</strong></div>
              <div><span className="text-gray-500 block mb-1 font-medium">Father's Name</span><strong className="text-gray-800 text-base">{selectedCustomer?.fathersName || '-'}</strong></div>
              <div><span className="text-gray-500 block mb-1 font-medium">Village/Area</span><strong className="text-gray-800 text-base">{selectedCustomer?.village || '-'}</strong></div>
              <div><span className="text-gray-500 block mb-1 font-medium">Phone Number</span><strong className="text-gray-800 text-base">{selectedCustomer?.phone || '-'}</strong></div>
            </div>
          </div>
          
          <div className="w-full md:w-auto text-center md:text-right mt-6 md:mt-0 md:border-l border-gray-100 md:pl-10 md:py-4">
            <div className="text-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">Current Net Balance</div>
            <div className="text-4xl md:text-5xl font-extrabold text-aarthikaBlue tracking-tight">{netBalance.startsWith('₹') ? netBalance : `₹${netBalance}`}</div>
          </div>
        </div>

        {/* Transaction Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="premium-card p-6 bg-green-50/30 border border-green-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              Deposit Funds
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-bold text-base">₹</span>
                <input 
                  type="number" 
                  className="input-premium pl-8 text-base py-2.5 shadow-sm focus:ring-green-500/20 focus:border-green-500 w-full" 
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openTxModal('DEPOSIT')}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="btn bg-green-600 text-white font-semibold text-base hover:bg-green-700 hover:shadow-lg shadow-green-600/30 transition-all px-6 py-2.5 whitespace-nowrap" 
                onClick={() => openTxModal('DEPOSIT')}
              >
                Initiate
              </button>
            </div>
          </div>

          <div className="premium-card p-6 bg-orange-50/30 border border-orange-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              Withdraw Funds
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-bold text-base">₹</span>
                <input 
                  type="number" 
                  className="input-premium pl-8 text-base py-2.5 shadow-sm focus:ring-orange-500/20 focus:border-orange-500 w-full" 
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openTxModal('WITHDRAWAL')}
                  placeholder="Amount" 
                />
              </div>
              <button 
                className="btn bg-orange-600 text-white font-semibold text-base hover:bg-orange-700 hover:shadow-lg shadow-orange-600/30 transition-all px-6 py-2.5 whitespace-nowrap" 
                onClick={() => openTxModal('WITHDRAWAL')}
              >
                Initiate
              </button>
            </div>
          </div>
        </div>

        {transactionMsg.text && (
          <div className={`p-4 rounded-xl mb-8 font-semibold text-center shadow-sm border ${transactionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {transactionMsg.text}
          </div>
        )}

        {/* Ledger History */}
        <div className="premium-card overflow-hidden shadow-lg border-0">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Transaction Ledger History</h3>
          </div>
          
          {ledgerLoading ? (
            <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-3 font-medium"><svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading records...</div>
          ) : (
            <div>
              {/* DESKTOP VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white border-b border-gray-100">
                      <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Date & Time</th>
                      <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Type / Method</th>
                      <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Amount (₹)</th>
                      <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Net Balance (₹)</th>
                      <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider">Proof</th>
                      <th className="py-4 px-8 font-semibold text-gray-500 text-sm uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.map((row, index) => {
                      const date = row.timestamp || 'Unknown';
                      const type = row.type || '';
                      const amount = row.amount || '0.00';
                      const balance = row.runningBalance || '0.00';
                      const status = row.status || 'PENDING';
                      const method = row.method || 'CASH';
                      const formLink = row.formLink || '';
                      const personLink = row.personLink || '';

                      return (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-8 text-sm text-gray-600 font-medium">{date}</td>
                          <td className="py-4 px-8">
                            <div className="flex flex-col">
                              <span className={`inline-flex items-center w-fit px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {type}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{method}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-8 text-sm font-bold ${type === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'}`}>
                            {type === 'DEPOSIT' ? '+' : '-'}{amount}
                          </td>
                          <td className="py-4 px-8 text-sm font-bold text-gray-800">{balance}</td>
                          <td className="py-4 px-8">
                            <div className="flex gap-2">
                              {formLink && (
                                <button onClick={() => setZoomedImage(getSecurePhotoUrl(formLink))} className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:scale-110 transition-all" title="View Form">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </button>
                              )}
                              {personLink && (
                                <button onClick={() => setZoomedImage(getSecurePhotoUrl(personLink))} className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 hover:scale-110 transition-all" title="View Customer">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </button>
                              )}
                              <button onClick={() => setPrintTransaction({ type, method, amount, balance, status, timestamp: date, rowId: index })} className="w-8 h-8 rounded bg-gray-50 text-gray-600 border border-gray-200 flex items-center justify-center hover:bg-gray-200 hover:scale-110 transition-all" title="Print Receipt">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-8 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-gray-200 text-gray-500 bg-gray-50">
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {ledger.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-500 font-medium text-lg">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            No transactions found for this account.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW (CARDS) */}
              <div className="block md:hidden divide-y divide-gray-100 bg-white">
                {ledger.map((row, index) => {
                  const date = row.timestamp || 'Unknown';
                  const type = row.type || '';
                  const amount = row.amount || '0.00';
                  const balance = row.runningBalance || '0.00';
                  const status = row.status || 'PENDING';
                  const method = row.method || 'CASH';
                  const formLink = row.formLink || '';
                  const personLink = row.personLink || '';

                  return (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {type}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{method}</span>
                        </div>
                        <span className={`text-base font-bold ${type === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'}`}>
                          {type === 'DEPOSIT' ? '+' : '-'}{amount}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-500 font-medium">{date}</span>
                        <span className="text-sm font-bold text-gray-800 tracking-tight">Bal: {balance}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-gray-200 text-gray-500 bg-gray-50 shadow-sm">
                          {status}
                        </span>
                        
                        <div className="flex gap-2">
                          {formLink && (
                            <button onClick={() => setZoomedImage(getSecurePhotoUrl(formLink))} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 shadow-sm" title="View Form">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                          )}
                          {personLink && (
                            <button onClick={() => setZoomedImage(getSecurePhotoUrl(personLink))} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 shadow-sm" title="View Customer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </button>
                          )}
                          <button onClick={() => setPrintTransaction({ type, method, amount, balance, status, timestamp: date, rowId: index })} className="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 shadow-sm" title="Print Receipt">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {ledger.length === 0 && (
                  <div className="py-12 text-center text-gray-500 font-medium">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    No transactions found.
                  </div>
                )}
              </div>

              {Math.ceil(ledger.length / itemsPerPage) > 1 && (
                <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, ledger.length)}</span> of <span className="font-bold text-gray-800">{ledger.length}</span> transactions
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(ledger.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(ledger.length / itemsPerPage)}
                      className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Profile" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-4 ring-white/20"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Transaction Modal Overlay */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-4 sm:p-6 border-b text-white sticky top-0 z-10 flex justify-between items-center ${txType === 'DEPOSIT' ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-orange-600 to-orange-500'}`}>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide">
                Secure {txType} Authentication
              </h2>
              <button onClick={() => !transactionLoading && setTxModalOpen(false)} className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Final Amount (₹)</label>
                  <input 
                    type="number" 
                    className={`input-premium w-full text-xl font-bold py-3 ${txType === 'DEPOSIT' ? 'focus:border-green-500 focus:ring-green-500/20' : 'focus:border-orange-500 focus:ring-orange-500/20'}`}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    disabled={transactionLoading}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${txMethod === 'CASH' ? 'bg-white shadow-sm text-aarthikaBlue' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setTxMethod('CASH')}
                      disabled={transactionLoading}
                    >
                      CASH
                    </button>
                    <button 
                      className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${txMethod === 'UPI' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setTxMethod('UPI')}
                      disabled={transactionLoading}
                    >
                      UPI
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Verification Capture (Mandatory)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Form Capture */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      id="formCamera" 
                      className="hidden" 
                      onChange={(e) => handleTxCameraCapture(e, setTxFormImage)}
                      disabled={transactionLoading}
                    />
                    <label htmlFor="formCamera" className={`block w-full aspect-square sm:aspect-auto sm:h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${txFormImage ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                      {txFormImage ? (
                        <div className="relative w-full h-full">
                          <img src={txFormImage} alt="Form" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Retake Photo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 mb-3 group-hover:text-aarthikaBlue group-hover:scale-110 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-gray-600">Scan Filled Form</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Customer Photo */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="user" 
                      id="personCamera" 
                      className="hidden" 
                      onChange={(e) => handleTxCameraCapture(e, setTxPersonImage)}
                      disabled={transactionLoading}
                    />
                    <label htmlFor="personCamera" className={`block w-full aspect-square sm:aspect-auto sm:h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${txPersonImage ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                      {txPersonImage ? (
                        <div className="relative w-full h-full">
                          <img src={txPersonImage} alt="Person" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Retake Photo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 mb-3 group-hover:text-aarthikaBlue group-hover:scale-110 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span className="text-sm font-bold text-gray-600">Scan Customer Face</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {transactionMsg.text && (
                <div className={`p-4 rounded-xl mb-6 font-semibold text-center text-sm shadow-sm border ${transactionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {transactionMsg.text}
                </div>
              )}

              <button 
                onClick={handleTransactionSubmit}
                disabled={transactionLoading || !txAmount || !txFormImage || !txPersonImage}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
                  transactionLoading || !txAmount || !txFormImage || !txPersonImage
                    ? 'bg-gray-300 cursor-not-allowed opacity-70 shadow-none'
                    : txType === 'DEPOSIT' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30 hover:shadow-green-600/50'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30 hover:shadow-orange-600/50'
                }`}
              >
                {transactionLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Uploading Assets & Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Confirm & Secure {txType}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL */}
      {printTransaction && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden print:w-[80mm] print:shadow-none print:rounded-none">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center print:hidden">
              <h3 className="font-bold text-gray-800">Print Preview (80mm)</h3>
              <button onClick={() => setPrintTransaction(null)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div id="thermal-receipt-content" className="print-receipt-container p-6 bg-white text-black font-mono text-sm print:p-0 print:w-[80mm] print:text-xs mx-auto w-[80mm]">
               <div className="text-center mb-4">
                 <img src={logoTextUrl} className="h-16 mx-auto grayscale mb-1 object-contain" alt="Aarthika" />
                 <p className="text-xs text-gray-600 font-bold">Terminal: HQ-01</p>
               </div>
               <div className="border-t border-dashed border-gray-400 py-3 mb-2">
                 <p className="mb-1"><strong>Date:</strong> {printTransaction.timestamp}</p>
                 <p className="mb-1"><strong>Account:</strong> {selectedCustomer?.accountNumber}</p>
                 <p className="mb-1"><strong>Name:</strong> {selectedCustomer?.customerName}</p>
                 <p className="mb-1"><strong>Phone:</strong> {selectedCustomer?.phone}</p>
                 <p className="mb-1"><strong>Village:</strong> {selectedCustomer?.village || '-'}</p>
                 <p><strong>Executed By:</strong> <span className="font-bold uppercase">{staffAuth.staffName}</span></p>
               </div>
               <div className="border-t border-dashed border-gray-400 py-2 mb-2">
                 <div className="flex justify-between mb-1">
                   <span>Type:</span>
                   <span className="font-bold">{printTransaction.type} ({printTransaction.method})</span>
                 </div>
                 <div className="flex justify-between mb-1">
                   <span>Amount:</span>
                   <span className="font-bold">Rs. {printTransaction.amount}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Status:</span>
                   <span className="font-bold uppercase">{printTransaction.status}</span>
                 </div>
               </div>
               <div className="border-t-2 border-black py-4 mb-2 text-center bg-gray-50 print:bg-transparent">
                 <p className="text-xs uppercase font-bold text-gray-500 mb-1">Available Balance</p>
                 <h1 className="text-2xl font-black">Rs. {printTransaction.balance}</h1>
               </div>
               <div className="text-center text-[10px] text-gray-500 mt-6 border-t border-dashed border-gray-400 pt-3">
                 <p>Thank you for banking with us.</p>
                 <p>Keep this slip for your records.</p>
                 <p className="mt-2 text-gray-300">- - - - - - - - - - - - - -</p>
               </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t flex gap-2 print:hidden">
              <button 
                onClick={() => {
                  const element = document.getElementById('thermal-receipt-content');
                  const opt = {
                    margin:       0,
                    filename:     `Aarthika_Receipt_${printTransaction.timestamp}.pdf`,
                    image:        { type: 'jpeg', quality: 1 },
                    html2canvas:  { scale: 4, useCORS: true },
                    jsPDF:        { unit: 'mm', format: [80, 200], orientation: 'portrait' }
                  };
                  html2pdf().set(opt).from(element).save();
                }} 
                className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download 80mm PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
