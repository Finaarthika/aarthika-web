import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      orderId,
      date,
      customerName,
      customerPhone,
      customerVillage,
      category,
      metalType,
      purity,
      expectedWeight,
      advancePaid,
      notes,
      pdfBase64,
      staffName
    } = req.body || {};

    if (!orderId || !customerName) {
      return res.status(400).json({ error: 'Order ID and Customer Name are required.' });
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

    const DRIVE_FOLDER_ID = '1Xo3g-xTVJqBuH3OcnwsBZRW1VhIdhA8F'; // Using same folder as jewellery
    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'CUSTOM ORDERS';

    let pdfLink = '';

    // Upload PDF to Google Drive
    if (pdfBase64) {
      const boundary = 'foo_bar_baz_pdf';
      const metadata = {
        name: `${orderId}_Design_Internal.pdf`,
        parents: [DRIVE_FOLDER_ID],
        mimeType: 'application/pdf'
      };
      
      const headerBuffer = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) + `\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/pdf\r\n\r\n`
      );
      
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
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
        pdfLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      } else {
        console.error('Drive PDF upload failed:', await driveRes.text());
      }
    }

    // Append to Google Sheets
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A:A:append?valueInputOption=USER_ENTERED`;
    
    // Columns: A: Order ID, B: Date, C: Customer Name, D: Phone, E: Location, F: Jewellery Type, G: Metal & Purity, H: Expected Weight, I: Advance Paid, J: Instructions, K: Design Photo URL, L: Status, M: Staff
    const appendData = {
      values: [
        [
          orderId,
          date,
          String(customerName || '').trim(),
          String(customerPhone || '').trim(),
          String(customerVillage || '').trim(),
          String(category || '').trim(),
          `${metalType} ${purity}`,
          String(expectedWeight || '0').trim(),
          String(advancePaid || '0').trim(),
          String(notes || '').trim(),
          pdfLink,
          'PENDING',
          String(staffName || 'System')
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
      throw new Error(`Sheets Append Failed: ${errText}`);
    }

    return res.status(200).json({ success: true, orderId, pdfLink });

  } catch (error) {
    console.error('Custom Order Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
