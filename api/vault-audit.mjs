import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      date,
      time,
      staffName,
      categoryName,
      expectedCount,
      expectedWeight,
      actualCount,
      actualWeight,
      discrepancy,
      auditType,
      status,
      scalePhoto // base64 string
    } = req.body || {};

    if (!date || !categoryName) {
      return res.status(400).json({ error: 'Missing required audit details.' });
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

    const DRIVE_FOLDER_ID = '1ReNB0IqaiIQi6zR2EI1gBV3XFn3rbPRc'; // User provided AUDIT LOG folder
    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'AUDIT_LOGS';

    // 1. Upload Photo to Drive (if provided)
    let photoLink = 'No Photo';
    
    if (scalePhoto && scalePhoto.startsWith('data:image')) {
      const base64Data = scalePhoto.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const metadata = {
        name: `VaultAudit_${categoryName}_${date.replace(/\//g, '-')}_${time.replace(/:/g, '-')}.jpg`,
        parents: [DRIVE_FOLDER_ID]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([buffer], { type: 'image/jpeg' }));

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
      const driveRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      });

      if (driveRes.ok) {
        const driveData = await driveRes.json();
        photoLink = driveData.webViewLink;
        
        // Update permissions so anyone with the link can view it (avoids permission errors for the user)
        await fetch(`https://www.googleapis.com/drive/v3/files/${driveData.id}/permissions`, {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${accessToken}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             role: 'reader',
             type: 'anyone'
           })
        });
      } else {
        console.error("Drive upload failed:", await driveRes.text());
        photoLink = 'Upload Failed';
      }
    }

    // 2. Append row to Google Sheets
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:A:append?valueInputOption=USER_ENTERED`;
    
    const rowData = [
      date, 
      time, 
      staffName, 
      categoryName, 
      expectedCount, 
      expectedWeight, 
      actualCount, 
      actualWeight, 
      discrepancy, 
      auditType, 
      status, 
      photoLink
    ];

    const sheetRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    });

    if (!sheetRes.ok) {
      const errText = await sheetRes.text();
      throw new Error(`Google Sheets append failed: ${errText}`);
    }

    return res.status(200).json({ success: true, message: 'Audit recorded successfully', photoLink });

  } catch (error) {
    console.error("Vault Audit Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
