import crypto from 'crypto';

// Google's /token endpoint requires the client credentials to be formatted as a signed JWT assertion
function createJwtAssertion(clientEmail, privateKey) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  
  const claim = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  
  const signature = crypto.createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(privateKey, 'base64url');
    
  return `${header}.${claim}.${signature}`;
}

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error('GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variable is missing.');
    }

    // Normalize keys
    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    privateKey = privateKey.replace(/^"|"$/g, '').trim();
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\n/g, '\n').trim();
    
    if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
    }
    if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
      privateKey = `${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // LAYER 1: EXCHANGE FOR ACCESS TOKEN
    const assertion = createJwtAssertion(clientEmail, privateKey);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token Exchange Failed: ${tokenResponse.status} - ${errText}`);
    }

    const { access_token } = await tokenResponse.json();

    // LAYER 2: FETCH VIA SECURE AUTHORIZATION HEADER
    const sheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/CUSTOMER_PROFILES!A2:G`;

    const sheetResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`Google Sheets API responded with status ${sheetResponse.status}: ${errorText}`);
    }

    const data = await sheetResponse.json();
    const rows = data.values || [];

    // LAYER 3: MAP AND PUSH DATA
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
