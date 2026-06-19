import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      customerName,
      fathersName,
      village,
      phone,
      faceVector,
      aadharId,
      pdfFile
    } = req.body || {};

    if (!customerName || !phone) {
      return res.status(400).json({ error: 'Full Name and Contact No. are required.' });
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
      const errText = await tokenResponse.text();
      throw new Error(`Token Exchange Failed: ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

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
    const appendRange = 'CUSTOMER_PROFILES!A:H';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`;

    // Upload PDF to Google Drive if provided
    let photoLink = '';
    
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
        photoLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      } else {
        const driveErr = await driveRes.text();
        console.error('Drive upload failed:', driveErr);
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
          String(aadharId || '').trim()
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

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
