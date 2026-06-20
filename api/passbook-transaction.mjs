import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Collect body dynamically
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString();
    const body = bodyStr ? JSON.parse(bodyStr) : {};

    const { accountNumber, type, amount, method, pdfFile } = body;

    if (!accountNumber || !type || !amount) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!pdfFile) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Compliance Error: Transaction proof PDF is required.' });
    }

    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    // Normalize email
    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    
    // Decode the perfect, uncorrupted Private Key from Base64
    let privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    
    // Convert literal "\n" strings (from JSON copy-paste) back into actual structural newlines
    privateKeyString = privateKeyString.replace(/\\n/g, '\n').trim();

    // Import the private key into a subtle crypto object using jose
    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    // Create the JWT token payload exactly how Google expects it
    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive' // Full scope for writing sheets and drive
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token Exchange Failed for email [${clientEmail}]: ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    
    // First, fetch the current ledger to calculate the running balance
    const readRange = 'TRANSACTION_LEDGER!A2:F';
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(readRange)}`;
    
    const readResponse = await fetch(readUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    
    if (!readResponse.ok) {
      const errorText = await readResponse.text();
      throw new Error(`Failed to read ledger for balance check: ${errorText}`);
    }
    
    const readData = await readResponse.json();
    const rows = readData.values || [];
    
    const safeAccountNumber = String(accountNumber).trim();
    const accountRows = rows.filter(row => (row[1] ? String(row[1]).trim() : '') === safeAccountNumber);
    
    let currentBalance = 0;
    // Find the latest successful transaction to get the current running balance
    // We sort descending temporarily just for calculation
    const sortedRows = [...accountRows].sort((a, b) => new Date(b[0] || 0) - new Date(a[0] || 0));
    const latestSuccess = sortedRows.find(row => (row[5] ? String(row[5]).trim() : '') === 'SUCCESS');
    
    if (latestSuccess && latestSuccess[4]) {
      // Remove any currency symbols/commas and parse
      currentBalance = parseFloat(String(latestSuccess[4]).replace(/[^0-9.-]+/g, '')) || 0;
    }

    const safeType = String(type).trim().toUpperCase();
    const safeMethod = String(method || 'CASH').trim().toUpperCase();
    const safeAmount = parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
    
    if (safeAmount <= 0) {
      return res.status(400).json({ error: 'Transaction amount must be greater than zero.' });
    }

    // Overdraft Protection Logic
    if (safeType === 'WITHDRAWAL' && safeAmount > currentBalance) {
      return res.status(400).json({ 
        error: 'Insufficient Funds', 
        message: `Cannot withdraw ₹${safeAmount}. Current Net Balance is only ₹${currentBalance}.` 
      });
    }

    let newBalance = currentBalance;
    if (safeType === 'DEPOSIT') {
      newBalance += safeAmount;
    } else if (safeType === 'WITHDRAWAL') {
      newBalance -= safeAmount;
    } else {
      return res.status(400).json({ error: 'Invalid transaction type. Must be DEPOSIT or WITHDRAWAL.' });
    }

    // Format new balance string
    const runningBalanceStr = `₹${newBalance.toFixed(2)}`;
    const amountStr = `₹${safeAmount.toFixed(2)}`;

    const appendRange = 'TRANSACTION_LEDGER!A:F';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`;

    // Swedish locale produces 'YYYY-MM-DD HH:mm:ss' format
    const now = new Date();
    const timestamp = now.toLocaleString('sv-SE').replace('T', ' ');
    const status = 'SUCCESS';

    // Prepare files for Google Drive
    const uploadToDrive = async (base64Str, name, mimeType) => {
      const metadata = { name: name, parents: ['1-n92zn1gQCxMU2Xi59dMRJLW4KNkS1sY'] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      const byteCharacters = atob(base64Str);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) byteArrays.push(byteCharacters.charCodeAt(i));
      form.append('file', new Blob([new Uint8Array(byteArrays)], { type: mimeType }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
      });
      if (!res.ok) throw new Error(`Drive Upload Failed: ${await res.text()}`);
      return await res.json();
    };

    const cleanPdf = pdfFile.includes(',') ? pdfFile.split(',')[1] : pdfFile;

    const pdfRes = await uploadToDrive(cleanPdf, `${safeAccountNumber}_${timestamp}_PROOF.pdf`, 'application/pdf');
    const pdfLink = `https://drive.google.com/file/d/${pdfRes.id}/view`; // Use direct view link for PDF

    const appendData = {
      values: [
        [timestamp, safeAccountNumber, safeType, amountStr, runningBalanceStr, status, safeMethod, pdfLink]
      ]
    };

    const sheetResponse = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appendData)
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`Google Sheets API responded with status ${sheetResponse.status}: ${errorText}`);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: 'Transaction recorded successfully.', newBalance: runningBalanceStr });

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
