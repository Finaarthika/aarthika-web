import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/4.png';
import { dummyInventoryData } from './dummyInventory';

const OfficerHeader = ({ officerName, onBack }) => (
  <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0d0d14] via-aarthikaDark to-red-900/40 py-3 sm:py-4 px-4 sm:px-8 shadow-2xl border-b border-white/10 overflow-hidden backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-white hover:text-red-300 transition-colors bg-white/5 p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex items-center group cursor-default">
          <div className="relative bg-white rounded-full w-12 h-12 sm:w-14 sm:h-14 mr-4 shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5">
            <img src={logoIcon} alt="Aarthika Icon" className="h-full w-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-100 to-red-400 tracking-tight flex items-center gap-2">
              AARTHIKA <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-500/30">VAULT AUDIT</span>
            </span>
            <span className="text-red-200/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Enterprise EOD Ledger</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 z-10">
        <div className="flex flex-col items-end hidden sm:flex">
          <div className="text-white/60 text-xs font-medium tracking-wider uppercase">Active Officer</div>
          <div className="text-white/90 text-sm font-semibold">{officerName || 'System'}</div>
        </div>
      </div>
    </div>
  </div>
);

export default function VaultAuditTerminal() {
  const navigate = useNavigate();
  const [officerAuth, setOfficerAuth] = useState(() => {
    const saved = localStorage.getItem('aarthika_staff_auth');
    return saved ? JSON.parse(saved) : { loggedIn: false, staffName: '' };
  });

  useEffect(() => {
    if (!officerAuth.loggedIn) {
      navigate('/jewellery');
    }
  }, [officerAuth, navigate]);

  const [categories, setCategories] = useState(dummyInventoryData.categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [auditInput, setAuditInput] = useState({
    count: '',
    weight: ''
  });
  
  const [auditResult, setAuditResult] = useState(null);
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const ToastComponent = () => {
    if (!toast.visible) return null;
    return (
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 duration-300 font-medium tracking-wide text-sm ${toast.type === 'error' ? 'bg-red-600 text-white shadow-red-900/30' : 'bg-[#10b981] text-white shadow-emerald-900/30'}`}>
        {toast.message}
      </div>
    );
  };

  const [scalePhoto, setScalePhoto] = useState('');

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const bmp = await window.createImageBitmap(file);
      const canvas = document.createElement('canvas');
      let width = bmp.width; let height = bmp.height;
      if (width > 800) { height *= 800 / width; width = 800; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, width, height);
      setScalePhoto(canvas.toDataURL('image/jpeg', 0.7));
    } catch (err) {
      showToast("Error processing camera image.", "error");
    }
  };

  const logAuditToDatabase = () => {
    showToast("Audit successfully recorded to secure ledger.", "success");
    resetAudit();
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const expectedClosingCount = selectedCategory ? 
    (selectedCategory.openingCount - selectedCategory.soldCountToday + selectedCategory.addedCountToday) : 0;
  
  const expectedClosingWeight = selectedCategory ? 
    (selectedCategory.openingWeight - selectedCategory.soldWeightToday + selectedCategory.addedWeightToday) : 0;

  const handleAuditSubmit = () => {
    if (!selectedCategory || !auditInput.count || !auditInput.weight) return;

    const inputCount = parseInt(auditInput.count, 10);
    const inputWeight = parseFloat(auditInput.weight);

    const countMatch = inputCount === expectedClosingCount;
    // Allow minor floating point tolerance
    const weightMatch = Math.abs(inputWeight - expectedClosingWeight) < 0.01;

    if (countMatch && weightMatch) {
      if (selectedCategory.requiresDeepAudit) {
        setAuditResult({
          status: 'deep_audit',
          message: '🔴 DEEP AUDIT TRIGGERED: Numbers match, but random deep audit requires spread-out verification photo.'
        });
      } else {
        setAuditResult({
          status: 'success',
          message: '✅ AUDIT MATCH: Quick scale photo required to close.'
        });
      }
    } else {
      setAuditResult({
        status: 'error',
        message: `❌ DISCREPANCY DETECTED: Expected ${expectedClosingCount} items (${expectedClosingWeight.toFixed(3)}g). Admin PIN required.`
      });
      setShowAdminOverride(true);
    }
  };

  const resetAudit = () => {
    setAuditInput({ count: '', weight: '' });
    setAuditResult(null);
    setShowAdminOverride(false);
    setAdminPin('');
    setScalePhoto('');
  };

  if (!officerAuth.loggedIn) return null;

  return (
    <div className="min-h-screen bg-aarthikaDark font-sans selection:bg-red-500/30 text-white flex flex-col">
      <ToastComponent />
      <OfficerHeader officerName={officerAuth.staffName} onBack={() => navigate('/jewellery')} />
      
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Info */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">End of Day Vault Audit</h2>
              <p className="text-white/60 text-sm">Select a category and input the physical scale readings. Expected values are hidden to ensure a blind audit.</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white/50 uppercase tracking-widest mb-1">Audit Date</div>
              <div className="text-lg font-bold text-red-400">{new Date().toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Input */}
            <div className="bg-[#11111a] rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Audit Entry</h3>
              </div>

              <div className="space-y-6 flex-grow">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Select Category <span className="text-red-500">*</span></label>
                  <select
                    className="w-full bg-[#0a0a0f] text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all appearance-none"
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      resetAudit();
                    }}
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.metalType} {c.purity})</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Physical Item Count <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className="w-full bg-[#0a0a0f] text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-xl font-medium"
                        placeholder="e.g. 48"
                        value={auditInput.count}
                        onChange={(e) => setAuditInput({...auditInput, count: e.target.value})}
                        disabled={auditResult !== null}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Physical Total Weight (g) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-full bg-[#0a0a0f] text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-xl font-medium"
                        placeholder="e.g. 240.000"
                        value={auditInput.weight}
                        onChange={(e) => setAuditInput({...auditInput, weight: e.target.value})}
                        disabled={auditResult !== null}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  onClick={handleAuditSubmit}
                  disabled={!selectedCategory || !auditInput.count || !auditInput.weight || auditResult !== null}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  VERIFY AUDIT
                </button>
              </div>
            </div>

            {/* Right Column: Result / Status */}
            <div className="bg-[#11111a] rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
              {!auditResult ? (
                <div className="text-center opacity-40">
                  <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <p className="text-sm uppercase tracking-widest font-semibold">Awaiting Input</p>
                  <p className="text-xs mt-2 max-w-xs mx-auto leading-relaxed">Enter the exact physical count and weight to verify against the secure vault ledger.</p>
                </div>
              ) : (
                <div className="w-full flex flex-col h-full z-10">
                  <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${
                    auditResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    auditResult.status === 'deep_audit' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {auditResult.status === 'success' && <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {auditResult.status === 'deep_audit' && <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    {auditResult.status === 'error' && <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    <p className="text-sm font-semibold leading-relaxed">{auditResult.message}</p>
                  </div>

                  {(auditResult.status === 'success' || auditResult.status === 'deep_audit') && (
                    <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-4 bg-white/5 hover:bg-white/10 transition-colors relative overflow-hidden group">
                      <input type="file" accept="image/*" capture="environment" id="cam-scale" className="hidden" onChange={handleCameraCapture} />
                      {!scalePhoto ? (
                        <div onClick={() => document.getElementById('cam-scale').click()} className="flex flex-col items-center cursor-pointer w-full h-full justify-center py-8">
                          <svg className="w-12 h-12 text-white/40 group-hover:text-white/60 mb-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <p className="text-sm font-semibold text-white/80 text-center">
                            {auditResult.status === 'deep_audit' ? 'Tap to Capture Spread-Out Photo' : 'Tap to Capture Scale Photo'}
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center">
                          <img src={scalePhoto} className="w-full h-32 object-cover rounded-lg mb-4" alt="Scale" />
                          <button onClick={logAuditToDatabase} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm uppercase tracking-wider">
                            Submit Audit Log
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {showAdminOverride && (
                    <div className="flex-grow flex flex-col justify-center">
                      <div className="bg-red-500/5 p-5 rounded-xl border border-red-500/20">
                        <label className="block text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Admin Override PIN required</label>
                        <input
                          type="password"
                          className="w-full bg-[#0a0a0f] text-white border border-red-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-center tracking-[0.5em] font-mono text-xl"
                          placeholder="••••"
                          maxLength={4}
                          value={adminPin}
                          onChange={(e) => setAdminPin(e.target.value)}
                        />
                        <button onClick={logAuditToDatabase} className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm uppercase tracking-wider">
                          Authorize Discrepancy Log
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <button onClick={resetAudit} className="text-xs font-semibold text-white/50 hover:text-white transition-colors uppercase tracking-widest w-full text-center">
                      Reset & Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
