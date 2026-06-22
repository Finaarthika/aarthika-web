import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      customerName,
      customerPhone,
      itemDescription,
      totalValue,
      branchName,
      officerName,
      customerPhoto
    } = req.body || {};

    if (!customerName || !totalValue) {
      return res.status(400).json({ error: 'Customer Name and Total Value are required.' });
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

    const { access_token: accessToken } = await tokenResponse.json();

    const DRIVE_FOLDER_ID = '1Xo3g-xTVJqBuH3OcnwsBZRW1VhIdhA8F';
    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'JEWELLERY_SALES';

    // Generate Invoice No (JS-YYYYMMDD-RandomHex)
    const dateObj = new Date();
    const dateStr = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const ymdStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const randHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const invoiceNo = `JS-${ymdStr}-${randHex}`;

    let photoLink = '';

    // Upload Photo if present
    if (customerPhoto) {
      const boundary = 'foo_bar_baz';
      const metadata = {
        name: `${invoiceNo}_Photo.jpg`,
        parents: [DRIVE_FOLDER_ID],
        mimeType: 'image/jpeg'
      };
      
      const headerBuffer = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) + `\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: image/jpeg\r\n\r\n`
      );
      
      const imageBuffer = Buffer.from(customerPhoto, 'base64');
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
        photoLink = `https://drive.google.com/uc?export=view&id=${driveData.id}`;
      } else {
        console.error('Drive Photo upload failed:', await driveRes.text());
      }
    }

    // Append to Google Sheets
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A:A:append?valueInputOption=USER_ENTERED`;
    
    const appendData = {
      values: [
        [
          invoiceNo,
          dateStr,
          String(branchName || 'Main Branch'),
          String(officerName || 'System'),
          String(customerName || '').trim(),
          String(customerPhone || '').trim(),
          String(itemDescription || '').trim(),
          String(totalValue || '0').trim(),
          photoLink
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
      const errText = await sheetResponse.text();
      throw new Error(`Sheets Append Failed: ${sheetResponse.status} - ${errText}`);
    }

    return res.status(200).json({ success: true, invoiceNo, message: 'Sale Recorded' });

  } catch (error) {
    console.error('Jewellery Sales Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
