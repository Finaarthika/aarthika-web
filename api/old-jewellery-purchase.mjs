import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      date,
      customerName,
      customerVillage,
      customerPhone,
      itemsDescription,
      grossWeight,
      meltingPurity,
      finalValue,
      faceVectorStr,
      vaultPdfFile,
      invoiceNo // optional, for file naming
    } = req.body || {};

    if (!customerName) {
      return res.status(400).json({ error: 'Customer Name is required.' });
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
    const SHEET_NAME = 'OLD_JEWELLERY_PURCHASE';

    let vaultPdfLink = '';

    // Upload Vault PDF to Google Drive
    if (vaultPdfFile) {
      const boundary = 'foo_bar_baz_pdf';
      const metadata = {
        name: `${invoiceNo || Date.now()}_Old_Jewellery_Purchase.pdf`,
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
        vaultPdfLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      }
    }

    const safeStr = (val) => String(val || '').trim();
    const safeNum = (val) => String(val || '0').trim();

    // A: Date, B: Customer Name, C: Village, D: Phone, E: Items, F: Gross Weight, G: Melting Purity, H: Final Value, I: PDF Link, J: Face Vector
    const rowData = [
      safeStr(date),
      safeStr(customerName),
      safeStr(customerVillage),
      safeStr(customerPhone),
      safeStr(itemsDescription),
      safeNum(grossWeight),
      safeStr(meltingPurity),
      safeNum(finalValue),
      safeStr(vaultPdfLink),
      safeStr(faceVectorStr)
    ];

    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:J:append?valueInputOption=USER_ENTERED`;
    
    const appendResponse = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    });

    if (!appendResponse.ok) {
      const errText = await appendResponse.text();
      throw new Error(`Sheets Append Failed: ${appendResponse.status} - ${errText}`);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, pdfLink: vaultPdfLink });

  } catch (error) {
    console.error("Error in old-jewellery-purchase:", error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
