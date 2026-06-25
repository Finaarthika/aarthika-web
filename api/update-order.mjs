import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, rowIndex, goldsmithName } = req.body || {};

    if (!action || !rowIndex) {
      return res.status(400).json({ error: 'Action and RowIndex are required.' });
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
      scope: 'https://www.googleapis.com/auth/spreadsheets'
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

    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'CUSTOM_ORDER';

    let updateData = [];

    if (action === 'assign_goldsmith') {
        if (!goldsmithName) {
             return res.status(400).json({ error: 'Goldsmith Name is required.' });
        }
        updateData.push({
            range: `'${SHEET_NAME}'!M${rowIndex}`,
            values: [[goldsmithName]]
        });
    } else if (action === 'fulfill_order') {
        const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        updateData.push({
            range: `'${SHEET_NAME}'!A${rowIndex}`,
            values: [['TRUE']]
        });
        updateData.push({
            range: `'${SHEET_NAME}'!I${rowIndex}`,
            values: [[todayStr]]
        });
    } else {
        return res.status(400).json({ error: 'Invalid action.' });
    }

    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`;
    
    const requestBody = {
        valueInputOption: 'USER_ENTERED',
        data: updateData
    };

    const updateRes = await fetch(batchUpdateUrl, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!updateRes.ok) {
        const err = await updateRes.text();
        throw new Error(`Failed to update sheet: ${err}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Update Order Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
