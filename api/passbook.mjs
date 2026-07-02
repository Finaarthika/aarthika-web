import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = {};
    if (req.method === 'POST') {
       try {
         const chunks = [];
         for await (const chunk of req) {
           chunks.push(chunk);
         }
         const bodyStr = Buffer.concat(chunks).toString();
         body = bodyStr ? JSON.parse(bodyStr) : {};
       } catch (e) {
           body = req.body || {};
           if (typeof body === 'string') body = JSON.parse(body);
       }
    }

    const reqAction = req.query.action || body.action || body.authAction;

    if (!reqAction) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    let privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    privateKeyString = privateKeyString.replace(/\\n/g, '\n').trim();

    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive'
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
      throw new Error('Token Exchange Failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (reqAction === 'auth' || reqAction === 'login' || reqAction === 'check') {
       if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
       // Because auth already parses body internally, we override the local parsing conflict by renaming or just letting it use 'body'
       
    }
    else if (reqAction === 'create') {
       if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
       const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    
    // Fetch existing account numbers to determine the next one
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CUSTOMER_PROFILES!A2:A`;
    const readResponse = await fetch(readUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });
    
    if (!readResponse.ok) {
      throw new Error('Failed to read existing accounts to generate Account Number.');
    }
    
    const readData = await readResponse.json();
    const rows = readData.values || [];
    
    let nextAccNum = 1000; // default starting point
    const accNumbers = rows.map(r => r[0]).filter(Boolean);
    
    if (accNumbers.length > 0) {
      const nums = accNumbers.map(acc => {
        const match = String(acc).match(/ACC-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextAccNum = Math.max(...nums) + 1;
    }
    
    const newAccountNumber = `ACC-${nextAccNum}`;

    // Append the new row
    const appendRange = 'CUSTOMER_PROFILES!A:I';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`;

    let pdfLink = '';
    // Upload PDF to Google Drive if provided
    if (pdfFile) {
      const boundary = 'foo_bar_baz_boundary';
      const metadata = {
        name: `Aarthika_Account_${newAccountNumber}.pdf`,
        parents: ['1-n92zn1gQCxMU2Xi59dMRJLW4KNkS1sY']
      };
      
      const headerBuffer = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/pdf\r\n\r\n`
      );
      
      const pdfBuffer = Buffer.from(pdfFile, 'base64');
      const footerBuffer = Buffer.from(`\r\n--${boundary}--`);
      
      const multipartBody = Buffer.concat([headerBuffer, pdfBuffer, footerBuffer]);
      
      const pdfDriveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });
      
      if (pdfDriveRes.ok) {
        const driveDataPdf = await pdfDriveRes.json();
        pdfLink = `https://drive.google.com/file/d/${driveDataPdf.id}/view?usp=sharing`;
      } else {
        const driveErrPdf = await pdfDriveRes.text();
        console.error('Drive PDF upload failed:', driveErrPdf);
      }
    }

    // Upload Raw Profile Photo to Google Drive
    let photoLink = '';
    if (photoFile) {
      const boundary = 'photo_boundary_123';
      const metadata = {
        name: `Aarthika_Photo_${newAccountNumber}.jpg`,
        parents: ['1-n92zn1gQCxMU2Xi59dMRJLW4KNkS1sY']
      };
      
      const headerBuffer = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: image/jpeg\r\n\r\n`
      );
      
      const imageBuffer = Buffer.from(photoFile, 'base64');
      const footerBuffer = Buffer.from(`\r\n--${boundary}--`);
      
      const multipartBody = Buffer.concat([headerBuffer, imageBuffer, footerBuffer]);
      
      const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });
      
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        // Use the uc?export=view format to allow <img> tags to render the raw image bytes
        photoLink = `https://drive.google.com/uc?export=view&id=${driveData.id}`;
      } else {
        const driveErr = await driveRes.text();
        console.error('Drive Photo upload failed:', driveErr);
      }
    }

    const appendData = {
      values: [
        [
          newAccountNumber,
          String(customerName || '').trim(),
          String(fathersName || '').trim(),
          String(village || '').trim(),
          String(phone || '').trim(),
          photoLink,
          String(faceVector || '').trim(),
          String(aadharId || '').trim(),
          pdfLink
        ]
      ]
    };

    const sheetResponse = await fetch(appendUrl, {
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
    return res.status(200).json({ 
      success: true, 
      message: 'Account created successfully.',
      accountNumber: newAccountNumber 
    });
    }
    else if (reqAction === 'image') {
       if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
       const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`;
    const imageResponse = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      throw new Error(`Google Drive API responded with status ${imageResponse.status}: ${errText}`);
    }

    // Stream the image bytes directly to the client with appropriate headers
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    
    // Pipe the response body to the client
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.status(200).send(buffer);
    }
    else if (reqAction === 'ledger') {
       if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
       const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const range = 'TRANSACTION_LEDGER!A2:I';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    const sheetResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`Google Sheets API responded with status ${sheetResponse.status}: ${errorText}`);
    }

    const data = await sheetResponse.json();
    const rows = data.values || [];

    const safeAccountNumber = String(accountNumber).trim();

    const accountRows = rows.filter(row => {
      const acct = row[1] ? String(row[1]).trim() : '';
      return acct === safeAccountNumber;
    });

    let transactions = accountRows.map((row, index) => {
      return {
        id: index,
        timestamp: row[0] ? String(row[0]).trim() : '',
        type: row[2] ? String(row[2]).trim() : '',
        amount: row[3] ? String(row[3]).trim() : '',
        runningBalance: row[4] ? String(row[4]).trim() : '',
        status: row[5] ? String(row[5]).trim() : '',
        method: row[6] ? String(row[6]).trim() : 'CASH',
        formLink: row[7] ? String(row[7]).trim() : '',
        personLink: row[8] ? String(row[8]).trim() : ''
      };
    });

    // Sort descending by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    let currentNetBalance = '0.00';
    const latestSuccess = transactions.find(t => t.status === 'SUCCESS');
    if (latestSuccess && latestSuccess.runningBalance) {
      currentNetBalance = latestSuccess.runningBalance;
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
      data: transactions,
      currentNetBalance: currentNetBalance
    });
    }
    else if (reqAction === 'search') {
       if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
       const sheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/CUSTOMER_PROFILES!A2:I`;

    const sheetResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`Google Sheets API responded with status ${sheetResponse.status}: ${errorText}`);
    }

    const data = await sheetResponse.json();
    const rows = data.values || [];

    const searchQuery = req.query.search ? String(req.query.search).toLowerCase().trim() : '';

    const customers = rows.map(row => {
      return {
        accountNumber: row[0] ? String(row[0]).trim() : '',
        customerName: row[1] ? String(row[1]).trim() : '',
        fathersName: row[2] ? String(row[2]).trim() : '',
        village: row[3] ? String(row[3]).trim() : '',
        phone: row[4] ? String(row[4]).trim() : '',
        photoLink: row[5] ? String(row[5]).trim() : '',
        faceVector: row[6] ? String(row[6]).trim() : '',
        aadharId: row[7] ? String(row[7]).trim() : '',
        pdfLink: row[8] ? String(row[8]).trim() : ''
      };
    }).filter(c => {
      return c.accountNumber !== '' || c.customerName !== '';
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ data: customers });
    }
    else if (reqAction === 'transaction') {
       if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
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

    // Swedish locale produces 'YYYY-MM-DD HH:mm:ss' format, force to India Standard Time (IST)
    const now = new Date();
    const timestamp = now.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace('T', ' ');
    const status = 'SUCCESS';

    // Prepare files for Google Drive
    const uploadToDrive = async (base64Str, name) => {
      const metadata = { name: name, parents: ['1-n92zn1gQCxMU2Xi59dMRJLW4KNkS1sY'] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      const byteCharacters = atob(base64Str);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) byteArrays.push(byteCharacters.charCodeAt(i));
      form.append('file', new Blob([new Uint8Array(byteArrays)], { type: 'image/jpeg' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
      });
      if (!res.ok) throw new Error(`Drive Upload Failed: ${await res.text()}`);
      return await res.json();
    };

    // Clean base64 strings if they contain prefixes
    const cleanForm = formImage.includes(',') ? formImage.split(',')[1] : formImage;
    const cleanPerson = personImage.includes(',') ? personImage.split(',')[1] : personImage;

    const [formRes, personRes] = await Promise.all([
      uploadToDrive(cleanForm, `${safeAccountNumber}_${timestamp}_FORM.jpg`),
      uploadToDrive(cleanPerson, `${safeAccountNumber}_${timestamp}_PERSON.jpg`)
    ]);

    const formLink = `https://drive.google.com/uc?export=view&id=${formRes.id}`;
    const personLink = `https://drive.google.com/uc?export=view&id=${personRes.id}`;

    const appendData = {
      values: [
        [timestamp, safeAccountNumber, safeType, amountStr, runningBalanceStr, status, safeMethod, formLink, personLink]
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
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid action provided' });
    }

  } catch (error) {
    console.error('Passbook Master API Error:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
