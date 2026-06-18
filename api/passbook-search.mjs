import crypto from 'crypto';

// Helper to base64url encode a string
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Custom RSA-SHA256 signature generator for JWT
function signAssertion(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, 'base64');
  
  const signatureEncoded = signature
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${signatureInput}.${signatureEncoded}`;
}

// Perform OAuth2 assertion exchange with Google OAuth2 Server
async function getAccessToken(clientEmail, privateKey) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat
  };
  
  const assertion = signAssertion(claim, privateKey);
  
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
    throw new Error(`Failed to retrieve Google OAuth token: ${tokenResponse.status} - ${errText}`);
  }
  
  const tokenJson = await tokenResponse.json();
  return tokenJson.access_token;
}

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not defined.');
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsStr);
    } catch (parseError) {
      throw new Error(`Failed to parse credentials JSON string: ${parseError.message}`);
    }

    const clientEmail = credentials.client_email;
    let privateKey = credentials.private_key;

    if (!clientEmail || !privateKey) {
      throw new Error('Google credentials JSON is missing client_email or private_key.');
    }

    // Clean up Vercel newline escapings inside the private key
    privateKey = privateKey.replace(/\\n/g, '\n');

    console.log("Acquiring access token via dependency-free OAuth2 signer...");
    const accessToken = await getAccessToken(clientEmail, privateKey);

    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const range = 'CUSTOMER_PROFILES!A2:G'; // Fetching column A-G for profile fields and biometrics
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    console.log("Fetching customer profiles from Google Sheets API...");
    const sheetResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`Google Sheets API responded with status ${sheetResponse.status}: ${errorText}`);
    }

    const data = await sheetResponse.json();
    const rows = data.values || [];

    // Map rows using strict index checking bounds to prevent crashes on empty/truncated rows
    const customers = rows.map(row => {
      const accountNumber = row[0] ? String(row[0]).trim() : '';
      const customerName = row[1] ? String(row[1]).trim() : '';
      const fathersName = row[2] ? String(row[2]).trim() : '';
      const village = row[3] ? String(row[3]).trim() : '';
      const phone = row[4] ? String(row[4]).trim() : '';
      const photoLink = row[5] ? String(row[5]).trim() : '';
      const faceVector = row[6] ? String(row[6]).trim() : '';

      return {
        accountNumber,
        customerName,
        fathersName,
        village,
        phone,
        photoLink,
        faceVector
      };
    }).filter(c => c.accountNumber !== '' || c.customerName !== '');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ data: customers });

  } catch (error) {
    console.error("Error in passbook-search API proxy:", error.message);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.',
      details: error.stack
    });
  }
};
