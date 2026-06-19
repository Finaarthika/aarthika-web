import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import './passbook.css';

export default function SearchGrid() {
  const [view, setView] = useState('SEARCH'); // 'SEARCH' or 'LEDGER'
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Webcam & Biometric State
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [model, setModel] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Ledger state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [netBalance, setNetBalance] = useState('0.00');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  
  // Transaction state
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionMsg, setTransactionMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    // Configure tflite WASM path pointing to the standard CDN
    window.tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/');
    
    const initTFLite = async () => {
      try {
        const loadedModel = await window.tflite.loadTFLiteModel('/facenet_512.tflite');
        setModel(loadedModel);
        console.log('TFLite FaceNet Model Loaded Successfully');
      } catch (err) {
        console.error('Failed to load TFLite model:', err);
      }
    };
    initTFLite();

    if (view === 'SEARCH') {
      fetchCustomers('');
    }
    // Cleanup webcam on unmount
    return () => {
      stopWebcam();
    };
  }, [view]);

  const fetchCustomers = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/passbook-search?search=${encodeURIComponent(query)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      // Add match score field
      const data = (body.data || []).map(c => ({ ...c, matchScore: null }));
      setCustomers(data);
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

  // --- BIOMETRIC PIPELINE ---

  const startWebcam = async () => {
    setIsScanning(true);
    setScanMessage('INITIALIZING CAMERA HARDWARE...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setScanMessage('CAMERA ACTIVE. ALIGN FACE AND EXTRACT.');
    } catch (err) {
      setScanMessage(`CAMERA ERROR: ${err.message}`);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setScanMessage('');
  };

  const extractFaceVector = () => {
    if (!videoRef.current || !model) {
      setScanMessage('MODEL OR CAMERA NOT READY.');
      return;
    }
    
    setScanMessage('EXTRACTING NATIVE 512-DIMENSIONAL EMBEDDING VIA TFLITE...');
    const video = videoRef.current;
    
    try {
      const vector = tf.tidy(() => {
        // Create tensor from video feed
        let imgTensor = tf.browser.fromPixels(video);
        
        // Resize to exactly 160x160 (Standard FaceNet input size)
        imgTensor = tf.image.resizeBilinear(imgTensor, [160, 160]);
        
        // Normalize: (pixel - 127.5) / 127.5 to get standard [-1, 1] embedding range
        imgTensor = imgTensor.sub(127.5).div(127.5);
        
        // Add batch dimension
        imgTensor = imgTensor.expandDims(0);
        
        // Execute inference through the loaded .tflite model
        const outputTensor = model.predict(imgTensor);
        
        // Pull native Float32Array of 512 dimensions
        return outputTensor.dataSync();
      });

      setScanMessage('VECTOR EXTRACTED. CROSS-REFERENCING DATABASE...');
      stopWebcam();
      
      // Execute matching engine
      performBiometricSort(vector);
    } catch (err) {
      setScanMessage(`INFERENCE ERROR: ${err.message}`);
    }
  };

  const calculateDistance = (vectorA, vectorB) => {
    return Math.sqrt(vectorA.reduce((sum, val, i) => sum + Math.pow(val - vectorB[i], 2), 0));
  };

  const performBiometricSort = (liveVector) => {
    const updatedCustomers = customers.map(c => {
      let score = 0;
      if (c.faceVector && c.faceVector !== '-') {
        try {
          // Parse string array from Google Sheet: "[0.1, -0.4, ...]"
          const dbArray = JSON.parse(c.faceVector);
          const dbVector = new Float32Array(dbArray);
          
          if (dbVector.length === 512) {
            const distance = calculateDistance(liveVector, dbVector);
            // Convert distance to confidence percentage (assuming max distance ~ 10 for standard embeddings)
            // This is a mapping function for demo confidence
            const confidence = Math.max(0, 100 - (distance * 5)); 
            score = confidence;
          }
        } catch (e) {
          // Invalid face code format
        }
      }
      return { ...c, matchScore: score };
    });

    // Sort descending by score
    updatedCustomers.sort((a, b) => b.matchScore - a.matchScore);
    setCustomers(updatedCustomers);
    setScanMessage('BIOMETRIC SORT COMPLETE.');
  };

  // --- LEDGER LOGIC ---

  const openLedger = async (customer) => {
    setSelectedCustomer(customer);
    setView('LEDGER');
    setTransactionMsg({ type: '', text: '' });
    await fetchLedger(customer.accountNumber);
  };

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

  const handleTransaction = async (type) => {
    const amount = type === 'DEPOSIT' ? depositAmount : withdrawAmount;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setTransactionMsg({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    setTransactionLoading(true);
    setTransactionMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/passbook-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: selectedCustomer.accountNumber,
          type: type,
          amount: amount
        })
      });
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }

      setTransactionMsg({ type: 'success', text: `SUCCESS: ${type} of ₹${amount} completed. New Balance: ${body.newBalance}` });
      if (type === 'DEPOSIT') setDepositAmount('');
      if (type === 'WITHDRAWAL') setWithdrawAmount('');
      
      await fetchLedger(selectedCustomer.accountNumber);
    } catch (err) {
      setTransactionMsg({ type: 'error', text: `ERROR: ${err.message}` });
    } finally {
      setTransactionLoading(false);
    }
  };

  // --- RENDER ---

  if (view === 'SEARCH') {
    return (
      <div className="passbook-container">
        <div className="terminal-divider">
          ╔════════════════════════════════════════════════════════════════════════════════╗<br/>
          ║ SEARCH BAR: [ <input 
            className="terminal-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            placeholder="Enter Name..."
          /> ] [ <button onClick={handleSearch} className="terminal-btn">🔍 SEARCH</button> ]   ║<br/>
          ║ BIOMETRICS: [ <button onClick={isScanning ? stopWebcam : startWebcam} className="terminal-btn">📷 {isScanning ? 'CANCEL' : 'SCAN FACE VIA WEBCAM'}</button> ]               ║<br/>
          ╚════════════════════════════════════════════════════════════════════════════════╝
        </div>

        {isScanning && (
          <div className="webcam-container">
            <video ref={videoRef} autoPlay playsInline width="320" height="240" style={{ border: '2px solid #00ff41' }} />
            <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
            <button onClick={extractFaceVector} className="terminal-btn" style={{ width: '100%', fontSize: '1.2rem', padding: '10px' }}>
              [ EXTRACT 512-VECTOR & SEARCH ]
            </button>
          </div>
        )}

        {scanMessage && <div style={{ color: '#00ff41', fontWeight: 'bold', margin: '1rem 0' }}>&gt; {scanMessage}</div>}
        {error && <div className="error-text">CONNECTION ERROR: {error}</div>}
        {loading && <div>SCANNING DATABASE...</div>}

        {!loading && !error && (
          <div style={{ marginTop: '2rem' }}>
            <div className="terminal-divider">╠════════════════════════╦═════════════════╦═════════════════╦═════════════════╦═══════════════╦═════════════╣</div>
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>║ Profile Image</th>
                  <th>║ Customer Name</th>
                  <th>║ Father's Name</th>
                  <th>║ Village/Address</th>
                  <th>║ Contact Number</th>
                  <th>║ Action      ║</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="terminal-divider" style={{margin: 0}}>╠════════════════════════╬═════════════════╬═════════════════╬═════════════════╬═══════════════╬═════════════╣</td>
                </tr>
                {customers.map((c, i) => (
                  <React.Fragment key={c.accountNumber || i}>
                    <tr>
                      <td>
                        ║ {c.photoLink ? <a href={c.photoLink} target="_blank" rel="noreferrer" className="terminal-btn">📷 IMAGE</a> : '[ NO IMG ]'}<br/>
                        {c.matchScore > 0 && <span style={{color: '#ffeb3b', fontSize: '0.8rem'}}>  [ MATCH: {c.matchScore.toFixed(1)}% CONFIDENCE ]</span>}
                      </td>
                      <td>║ {c.customerName || '-'}</td>
                      <td>║ {c.fathersName || '-'}</td>
                      <td>║ {c.village || '-'}</td>
                      <td>║ {c.phone || '-'}</td>
                      <td>║ <button onClick={() => openLedger(c)} className="terminal-btn">[VIEW U]</button> ║</td>
                    </tr>
                    <tr>
                      <td colSpan="6" className="terminal-divider" style={{margin: 0}}>╠════════════════════════╩═════════════════╩═════════════════╩═════════════════╩═══════════════╩═════════════╣</td>
                    </tr>
                  </React.Fragment>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>║ NO CUSTOMER RECORDS MATCHING QUERY ║</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- SCREEN 2: LEDGER ---
  return (
    <div className="passbook-container">
      <div>
        <button onClick={() => setView('SEARCH')} className="terminal-btn">
          [ ⬅ Back to Customer Search List ]
        </button>
      </div>

      <div className="terminal-divider">
        ╔════════════════════════════════════════════════════════════════════════════════╗<br/>
        ║                               CUSTOMER ACCOUNT PROFILE                         ║<br/>
        ╚════════════════════════════════════════════════════════════════════════════════╝
      </div>

      <div className="ledger-details-grid">
        <div>
          {selectedCustomer?.photoLink ? (
            <img 
              src={selectedCustomer.photoLink} 
              alt="Profile" 
              style={{ width: '120px', height: '120px', objectFit: 'cover', border: '2px solid #00ff41' }} 
            />
          ) : (
            <div className="scanner-box">
              [ NO PHOTO ]
            </div>
          )}
        </div>
        <div>
          <table style={{ textAlign: 'left', borderSpacing: '0 8px' }}>
            <tbody>
              <tr><td style={{paddingRight: '20px'}}>Account Number:</td><td><strong>{selectedCustomer?.accountNumber}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Full Name:</td><td><strong>{selectedCustomer?.customerName}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Father's Name:</td><td><strong>{selectedCustomer?.fathersName}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Village/Area:</td><td><strong>{selectedCustomer?.village}</strong></td></tr>
              <tr><td style={{paddingRight: '20px'}}>Phone Number:</td><td><strong>{selectedCustomer?.phone}</strong></td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Current Net Balance:</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{netBalance}</div>
        </div>
      </div>

      <div className="terminal-divider">
        ╠════════════════════════════════════════════════════════════════════════════════╣
      </div>

      <div className="action-forms-grid">
        <div className="terminal-box">
          <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ 📥 DEPOSIT CASH ]</div>
          <div style={{ marginBottom: '1rem' }}>
            Amount (₹): [ <input 
              type="number" 
              className="terminal-input" 
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Enter Amount" 
            /> ]
          </div>
          <button 
            className="terminal-btn" 
            onClick={() => handleTransaction('DEPOSIT')}
            disabled={transactionLoading}
          >
            [ {transactionLoading ? 'PROCESSING...' : 'EXECUTE DEPOSIT'} ]
          </button>
        </div>

        <div className="terminal-box">
          <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>[ 📤 WITHDRAW CASH ]</div>
          <div style={{ marginBottom: '1rem' }}>
            Amount (₹): [ <input 
              type="number" 
              className="terminal-input" 
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Enter Amount" 
            /> ]
          </div>
          <button 
            className="terminal-btn" 
            onClick={() => handleTransaction('WITHDRAWAL')}
            disabled={transactionLoading}
          >
            [ {transactionLoading ? 'PROCESSING...' : 'EXECUTE WITHDRAWAL'} ]
          </button>
        </div>
      </div>

      {transactionMsg.text && (
        <div className={transactionMsg.type === 'error' ? 'error-text' : 'success-text'} style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {transactionMsg.text}
        </div>
      )}

      <div className="terminal-divider">
        ╔════════════════════════════════════════════════════════════════════════════════╗<br/>
        ║                              COMPLETE TRANSACTION PASSBOOK HISTORY             ║<br/>
        ╚════════════════════════════════════════════════════════════════════════════════╝
      </div>

      {ledgerLoading ? (
        <div>LOADING LEDGER RECORDS...</div>
      ) : (
        <table className="terminal-table">
          <thead>
            <tr>
              <th>║ Date & Time</th>
              <th>║ Transaction Type</th>
              <th>║ Amount (INR)</th>
              <th>║ Running Balance</th>
              <th>║ Status      ║</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="terminal-divider" style={{margin: 0}}>╠════════════════════════╬══════════════════╬═════════════════╬═════════════════╬═════════════╣</td>
            </tr>
            {ledger.map((row) => (
              <React.Fragment key={row.id}>
                <tr>
                  <td>║ {row.timestamp}</td>
                  <td>║ {row.type}</td>
                  <td>║ {row.amount}</td>
                  <td>║ {row.runningBalance}</td>
                  <td>║ {row.status}</td>
                </tr>
              </React.Fragment>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>║ NO TRANSACTIONS FOUND ║</td>
              </tr>
            )}
            <tr>
              <td colSpan="5" className="terminal-divider" style={{margin: 0}}>╚════════════════════════╩══════════════════╩═════════════════╩═════════════════╩═════════════╝</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
