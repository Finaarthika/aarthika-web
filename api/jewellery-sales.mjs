import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      invoiceNo,
      date,
      branchName,
      officerName,
      customerName,
      customerPhone,
      itemDescription,
      netWeight,
      ratePerGram,
      metalValue,
      makingCharges,
      gstAmount,
      discount,
      grandTotal,
      vaultPdfFile
    } = req.body || {};

    if (!invoiceNo || !customerName) {
      return res.status(400).json({ error: 'Invoice No and Customer Name are required.' });
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

    let vaultPdfLink = '';

    // Upload Vault PDF to Google Drive
    if (vaultPdfFile) {
      const boundary = 'foo_bar_baz_pdf';
      const metadata = {
        name: `${invoiceNo}_Vault_Record.pdf`,
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
      
      const pdfBuffer = Buffer.from(vaultPdfFile, 'base64');
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
        // Since it's a PDF, we store the direct webViewLink or use the same ID format
        vaultPdfLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      } else {
        console.error('Drive PDF upload failed:', await driveRes.text());
      }
    }

    // Append 14 Columns to Google Sheets
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A:A:append?valueInputOption=USER_ENTERED`;
    
    const appendData = {
      values: [
        [
          invoiceNo,
          date,
          String(officerName || 'System'),
          String(customerName || '').trim(),
          String(customerPhone || '').trim(),
          String(itemDescription || '').trim(),
          String(netWeight || '0').trim(),
          String(ratePerGram || '0').trim(),
          String(metalValue || '0').trim(),
          String(makingCharges || '0').trim(),
          String(gstAmount || '0').trim(),
          String(discount || '0').trim(),
          String(grandTotal || '0').trim(),
          vaultPdfLink
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

    return res.status(200).json({ success: true, invoiceNo, message: 'Sale Recorded & PDF Vaulted' });

  } catch (error) {
    console.error('Jewellery Sales Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
