import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKeyString = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKeyString) {
      throw new Error('GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variable is missing.');
    }

    // Normalize keys
    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    privateKeyString = privateKeyString.replace(/^"|"$/g, '').trim();
    privateKeyString = privateKeyString.replace(/\\n/g, '\n').replace(/\n/g, '\n').trim();
    
    if (!privateKeyString.startsWith('-----BEGIN PRIVATE KEY-----')) {
      privateKeyString = `-----BEGIN PRIVATE KEY-----\n${privateKeyString}`;
    }
    if (!privateKeyString.endsWith('-----END PRIVATE KEY-----')) {
      privateKeyString = `${privateKeyString}\n-----END PRIVATE KEY-----`;
    }

    // Import the private key into a subtle crypto object using jose
    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    // Create the JWT token payload exactly how Google expects it
    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly'
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

    const sheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/CUSTOMER_PROFILES!A2:G`;

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

    const customers = rows.map(row => {
      return {
        accountNumber: row[0] ? String(row[0]).trim() : '',
        customerName: row[1] ? String(row[1]).trim() : '',
        fathersName: row[2] ? String(row[2]).trim() : '',
        village: row[3] ? String(row[3]).trim() : '',
        phone: row[4] ? String(row[4]).trim() : '',
        photoLink: row[5] ? String(row[5]).trim() : '',
        faceVector: row[6] ? String(row[6]).trim() : '',
      };
    }).filter(c => c.accountNumber !== '' || c.customerName !== '');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ data: customers });

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
