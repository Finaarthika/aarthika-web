import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import logoIcon from '../../assets/4.png';
import logoTextUrl from '../../assets/Aarthika-white.png';
import premiumLogo from '../../assets/3.png';

const OfficerHeader = ({ officerName, onLogout }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-emerald-950 via-gray-900 to-emerald-900 py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-emerald-500/20 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center group cursor-default">
        <div className="relative bg-emerald-50 rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 border-2 border-emerald-500/30">
          <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 to-emerald-400 tracking-tight flex items-center gap-2">
            AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">OLD SCRAP POS</span>
          </span>
          <span className="text-emerald-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise Purchase Terminal</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 z-10">
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="text-emerald-500/60 text-xs font-medium tracking-wider uppercase">Active Purchaser</div>
          <div className="text-emerald-100 text-sm font-semibold">{officerName || 'System'}</div>
        </div>
        <button onClick={onLogout} className="group flex items-center gap-2 bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300">
          <span className="text-sm font-bold text-white group-hover:text-red-400">SECURE LOGOUT</span>
        </button>
      </div>
    </div>
  </div>
);

export default function OldJewelleryTerminal() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showPrint, setShowPrint] = useState(false);
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
      try {
        return JSON.parse(saved);
      } catch (e) {}
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

  const [liveRates, setLiveRates] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error("Face API models load error", e);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (officerAuth.loggedIn) {
      verifyAuthSentinel(officerAuth);
      fetch('/api/metal-rates')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setLiveRates(data);
        })
        .catch(console.error);

      // Fetch existing customers for facial matching
      fetch('/api/jewellery-sales-search')
        .then(res => res.json())
        .then(data => {
           if (data.data) {
             setCustomers(data.data);
           }
        })
        .catch(console.error);
    }
  }, [officerAuth.loggedIn]);

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
          staffName: data.staffName,
          branchName: data.branchName || 'Main Branch'
        };
        setOfficerAuth(newAuth);
        localStorage.setItem('aarthika_staff_auth', JSON.stringify(newAuth));
      } else {
        setAuthError(data.error || 'Invalid credentials or unauthorized device.');
      }
    } catch (err) {
      setAuthError('Network error connecting to Auth Server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aarthika_staff_auth');
    setOfficerAuth({ loggedIn: false, userId: '', password: '', staffName: '' });
  };

  const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerVillage: '',
    itemsDescription: '',
    grossWeight: '',
    meltingPurity: '',
    finalValue: ''
  });

  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [faceVectorStr, setFaceVectorStr] = useState('');
  const [jewelleryPhoto, setJewelleryPhoto] = useState(null);
  const [activeCamera, setActiveCamera] = useState(null); // 'customer' or 'jewellery'
  const webcamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedData, setCapturedData] = useState(null);

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (activeCamera === 'customer') {
      setCustomerPhoto(imageSrc);
      if (modelsLoaded) {
        setIsScanning(true);
        try {
          const img = await faceapi.fetchImage(imageSrc);
          const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
          
          if (detections) {
            const currentDesc = detections.descriptor;
            setFaceVectorStr(Array.from(currentDesc).join(','));
            
            // Match against past customers
            let bestMatch = null;
            let lowestDistance = 0.6; // Threshold for face matching
            
            for (const cust of customers) {
               if (cust.faceVector) {
                  try {
                    const savedArr = cust.faceVector.split(',').map(Number);
                    const savedDesc = new Float32Array(savedArr);
                    const distance = faceapi.euclideanDistance(currentDesc, savedDesc);
                    if (distance < lowestDistance) {
                       lowestDistance = distance;
                       bestMatch = cust;
                    }
                  } catch(e) {}
               }
            }
            
            if (bestMatch) {
               showToast(`Match Found: ${bestMatch.customerName}`, 'success');
               setSaleData(prev => ({
                 ...prev,
                 customerName: bestMatch.customerName,
                 customerPhone: bestMatch.phone,
                 customerVillage: bestMatch.village
               }));
            } else {
               showToast('No matching customer found in Retail DB. New entry.', 'success');
            }
          } else {
             showToast('No face detected. Please ensure clear lighting.', 'error');
             setFaceVectorStr('');
          }
        } catch (e) {
          console.error("Face scanning error", e);
        } finally {
          setIsScanning(false);
        }
      }
    } else if (activeCamera === 'jewellery') {
      setJewelleryPhoto(imageSrc);
    }
    setActiveCamera(null);
  }, [webcamRef, activeCamera, modelsLoaded, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({ ...prev, [name]: value }));
  };

  const calculateSuggestedValue = () => {
    if (!liveRates || !saleData.grossWeight || !saleData.meltingPurity) return 0;
    // Attempt to guess metal type from description
    const isGold = saleData.itemsDescription.toLowerCase().includes('gold');
    const isSilver = saleData.itemsDescription.toLowerCase().includes('silver');
    
    const weight = parseFloat(saleData.grossWeight) || 0;
    const purityPercent = parseFloat(saleData.meltingPurity) || 0;
    
    let rate = 0;
    if (isGold) rate = liveRates.goldScrapRate || 0;
    else if (isSilver) rate = liveRates.silverScrapRate || 0;
    
    // rate is usually per gram of 24k or pure. 
    // Wait, scrap rates (A23/B23) might already be adjusted, but let's assume standard per gram pure.
    const pureWeight = weight * (purityPercent / 100);
    return Math.round(pureWeight * rate);
  };

  const submitPurchase = async () => {
    if (!saleData.customerName || !saleData.itemsDescription || !saleData.finalValue) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    if (!customerPhoto || !jewelleryPhoto) {
      showToast('Please capture both Customer and Jewellery photos for Vault Security.', 'error');
      return;
    }

    setCapturedData({ ...saleData, customerPhoto, jewelleryPhoto, faceVectorStr, date: new Date().toLocaleString('en-IN') });
    setShowPrint(true);
  };

  const finalizeTransaction = async (pdfDataUrl) => {
    setIsSubmitting(true);
    try {
      const payload = {
        date: capturedData.date,
        customerName: capturedData.customerName,
        customerVillage: capturedData.customerVillage,
        customerPhone: capturedData.customerPhone,
        itemsDescription: capturedData.itemsDescription,
        grossWeight: capturedData.grossWeight,
        meltingPurity: capturedData.meltingPurity,
        finalValue: capturedData.finalValue,
        faceVectorStr: capturedData.faceVectorStr,
        vaultPdfFile: pdfDataUrl.split(',')[1],
        invoiceNo: 'OP-' + Date.now()
      };

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
          ...capturedData,
          invoiceNo: payload.invoiceNo
        }));

        // Reset form
        setSaleData({ customerName: '', customerPhone: '', customerVillage: '', itemsDescription: '', grossWeight: '', meltingPurity: '', finalValue: '' });
        setCustomerPhoto(null);
        setJewelleryPhoto(null);
        setFaceVectorStr('');

        // Navigate to print
        navigate('/jewellery/old-purchase/print');
      } else {
        showToast(data.error || 'Failed to submit', 'error');
      }
    } catch(err) {
      showToast('Network error during submission.', 'error');
    } finally {
      setIsSubmitting(false);
      setShowPrint(false);
    }
  };

  // Wait, I need to render the Print Preview and generate the PDF.
  useEffect(() => {
    if (showPrint && capturedData) {
      const element = document.getElementById('vault-receipt');
      if (element) {
        html2pdf().from(element).set({
          margin: 0,
          filename: `Purchase_${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).outputPdf('datauristring').then(pdfString => {
           finalizeTransaction(pdfString);
        });
      }
    }
  }, [showPrint, capturedData]);

  if (!officerAuth.loggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        {/* Same login UI as Retail */}
        <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-950 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/20 shadow-inner mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">OLD SCRAP TERMINAL</h1>
            <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase mt-2">Authorized Access Only</p>
          </div>
          {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center mb-6 font-medium">{authError}</div>}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Officer ID</label>
              <input type="text" value={loginForm.userId} onChange={e => setLoginForm({...loginForm, userId: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Passcode</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" required />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/50 mt-4 tracking-wider uppercase text-sm">
              {authLoading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-inter text-gray-200">
      <OfficerHeader officerName={officerAuth.staffName} onLogout={handleLogout} />
      
      {toast.visible && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-full shadow-2xl font-bold text-sm tracking-wide border backdrop-blur-md flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {activeCamera && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900 p-2 rounded-3xl border border-gray-700 relative overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full rounded-2xl"
            />
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
              <button onClick={() => setActiveCamera(null)} className="px-6 py-3 bg-white/10 text-white rounded-full font-bold backdrop-blur-md">
                Cancel
              </button>
              <button onClick={capturePhoto} className="px-8 py-3 bg-emerald-500 text-white rounded-full font-black tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                {isScanning ? 'Scanning...' : 'Capture Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          <div className="flex-1 space-y-6">
             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h2 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Client Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Customer Full Name <span className="text-emerald-500">*</span></label>
                    <input type="text" name="customerName" value={saleData.customerName} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Autofills via Face Scan" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number <span className="text-emerald-500">*</span></label>
                    <input type="text" name="customerPhone" value={saleData.customerPhone} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="10-digit number" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Village / City</label>
                    <input type="text" name="customerVillage" value={saleData.customerVillage} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Location" />
                  </div>
                </div>
             </div>

             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
                <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Item Assessment
                </h2>
                <div className="space-y-5">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Item Description <span className="text-amber-500">*</span></label>
                      <input type="text" name="itemsDescription" value={saleData.itemsDescription} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" placeholder="e.g., Old Gold Chain 22K, Silver Payal" />
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Gross Weight (g) <span className="text-amber-500">*</span></label>
                        <input type="number" name="grossWeight" value={saleData.grossWeight} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Melting Purity (%) <span className="text-amber-500">*</span></label>
                        <input type="number" name="meltingPurity" value={saleData.meltingPurity} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" placeholder="e.g. 75, 91.6" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
                <h2 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  Security Vault Photos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Customer Face Scan</span>
                    {customerPhoto ? (
                      <div className="relative group rounded-xl overflow-hidden aspect-video border border-emerald-500/30">
                        <img src={customerPhoto} alt="Customer" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setActiveCamera('customer')} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">Retake</button>
                        </div>
                        {faceVectorStr && <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-1 rounded">VECTOR EXTRACTED</div>}
                      </div>
                    ) : (
                      <button onClick={() => setActiveCamera('customer')} className="flex-1 border-2 border-dashed border-gray-700 hover:border-emerald-500 hover:bg-emerald-500/5 rounded-xl aspect-video flex flex-col items-center justify-center text-gray-500 hover:text-emerald-400 transition-colors">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tap to Scan Face</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Old Jewellery Item</span>
                    {jewelleryPhoto ? (
                      <div className="relative group rounded-xl overflow-hidden aspect-video border border-rose-500/30">
                        <img src={jewelleryPhoto} alt="Jewellery" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setActiveCamera('jewellery')} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">Retake</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActiveCamera('jewellery')} className="flex-1 border-2 border-dashed border-gray-700 hover:border-rose-500 hover:bg-rose-500/5 rounded-xl aspect-video flex flex-col items-center justify-center text-gray-500 hover:text-rose-400 transition-colors">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tap to Capture Item</span>
                      </button>
                    )}
                  </div>
                </div>
             </div>
          </div>

          <div className="w-full lg:w-[400px] shrink-0">
             <div className="sticky top-24 bg-gray-950 border border-gray-800 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col h-[calc(100vh-120px)]">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                     Financial Summary
                   </h2>
                   {liveRates && (
                     <div className="text-[10px] font-bold bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 flex flex-col items-end">
                       <span className="text-amber-500">Gold: ₹{liveRates.goldScrapRate || 0}/g</span>
                       <span className="text-gray-400">Silver: ₹{liveRates.silverScrapRate || 0}/g</span>
                     </div>
                   )}
                </div>

                <div className="flex-grow space-y-4">
                   <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between items-center text-sm font-semibold mb-2 text-gray-400">
                         <span>Gross Weight</span>
                         <span>{saleData.grossWeight || '0'} g</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold mb-2 text-gray-400">
                         <span>Melting Purity</span>
                         <span>{saleData.meltingPurity || '0'} %</span>
                      </div>
                      <div className="h-px bg-gray-800 my-3"></div>
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-500">
                         <span>Suggested Valuation</span>
                         <span>₹ {calculateSuggestedValue().toLocaleString('en-IN')}</span>
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Final Agreed Value (₹) <span className="text-emerald-500">*</span></label>
                      <input type="number" name="finalValue" value={saleData.finalValue} onChange={handleInputChange} className="w-full bg-emerald-950 border-2 border-emerald-900 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-emerald-500 text-2xl font-black tracking-wider shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="0.00" />
                   </div>
                </div>

                <div className="pt-6 mt-auto">
                   <button onClick={submitPurchase} disabled={isSubmitting || showPrint} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] tracking-widest uppercase text-sm flex items-center justify-center gap-3">
                     {isSubmitting ? (
                       <span className="animate-pulse">Processing Secure Log...</span>
                     ) : showPrint ? (
                       <span className="animate-pulse">Generating Vault PDF...</span>
                     ) : (
                       <>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         SAVE & GENERATE SLIP
                       </>
                     )}
                   </button>
                   <p className="text-[9px] text-gray-600 text-center mt-4 font-semibold uppercase tracking-wider leading-relaxed">
                     Generates A4 Vault Record &<br/>A5 Customer Receipt
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showPrint && capturedData && (
         <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
           <div id="vault-receipt" className="bg-white w-[1123px] h-[790px] relative box-border flex flex-col font-inter">
             {/* Simple A4 Layout for html2pdf */}
             <div className="bg-[#1B1464] text-white px-8 py-6 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <img src={logoTextUrl} alt="Aarthika" className="h-10 object-contain" />
                 <div className="border-l border-white/20 pl-4 ml-2">
                   <h1 className="text-2xl font-black tracking-widest uppercase">MISHRA JEWELLER'S</h1>
                   <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em] mt-1">Old Scrap Purchase • Internal Vault Record</p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-lg font-black tracking-wider">{capturedData.invoiceNo}</div>
                 <div className="text-xs text-white/60 font-bold uppercase tracking-widest mt-1">{capturedData.date}</div>
               </div>
             </div>

             <div className="flex-grow flex p-8 gap-8">
               <div className="flex-1 space-y-6">
                 <div>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Customer Profile</h3>
                   <div className="text-2xl font-black text-gray-900">{capturedData.customerName}</div>
                   <div className="text-sm font-bold text-gray-600 mt-1">{capturedData.customerPhone} • {capturedData.customerVillage}</div>
                 </div>
                 
                 <div>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Scrap Item Details</h3>
                   <div className="text-lg font-bold text-gray-800 mb-3">{capturedData.itemsDescription}</div>
                   <div className="flex gap-8">
                     <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gross Wt</div>
                       <div className="text-xl font-black text-gray-900">{capturedData.grossWeight} g</div>
                     </div>
                     <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Melting Purity</div>
                       <div className="text-xl font-black text-gray-900">{capturedData.meltingPurity}%</div>
                     </div>
                   </div>
                 </div>

                 <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mt-8">
                   <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Final Purchase Value</div>
                   <div className="text-4xl font-black text-emerald-800">
                     {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(capturedData.finalValue)}
                   </div>
                 </div>
               </div>

               <div className="w-[450px] border-l border-gray-200 pl-8 space-y-6">
                 <div>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Live Customer Scan</h3>
                   <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-300">
                     {capturedData.customerPhoto && <img src={capturedData.customerPhoto} className="w-full h-full object-cover" />}
                   </div>
                   <div className="text-[7px] text-gray-400 font-mono break-all mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                     {capturedData.faceVectorStr ? `VECTOR: ${capturedData.faceVectorStr.substring(0, 150)}...` : 'NO VECTOR EXTRACTED'}
                   </div>
                 </div>
                 <div>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Scrap Jewellery Scan</h3>
                   <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-300">
                     {capturedData.jewelleryPhoto && <img src={capturedData.jewelleryPhoto} className="w-full h-full object-cover" />}
                   </div>
                 </div>
               </div>
             </div>

             <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
               <div>Processed By: {officerAuth.staffName}</div>
               <div>Aarthika Security System • Authenticated Record</div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
