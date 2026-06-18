import crypto from 'crypto';

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

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

async function getAccessToken(clientEmail, privateKey) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets', // Need full scope to write/append
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
    throw new Error(`Failed to retrieve Google OAuth token for email [${clientEmail}]: ${tokenResponse.status} - ${errText}`);
  }
  
  const tokenJson = await tokenResponse.json();
  return tokenJson.access_token;
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Collect body dynamically
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString();
    const body = bodyStr ? JSON.parse(bodyStr) : {};

    const { accountNumber, type, amount } = body;

    if (!accountNumber || !type || !amount) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error('GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variable is missing.');
    }

    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    if (privateKey) {
      privateKey = privateKey.replace(/^"|"$/g, '').trim();
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const accessToken = await getAccessToken(clientEmail, privateKey);

    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const range = 'TRANSACTION_LEDGER!A:F';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

    // Swedish locale produces 'YYYY-MM-DD HH:mm:ss' format
    const now = new Date();
    const timestamp = now.toLocaleString('sv-SE').replace('T', ' ');
    const runningBalance = 'PENDING';
    const status = 'SUCCESS';

    const safeAccountNumber = String(accountNumber).trim();
    const safeType = String(type).trim();
    const safeAmount = String(amount).trim();

    const appendData = {
      values: [
        [timestamp, safeAccountNumber, safeType, safeAmount, runningBalance, status]
      ]
    };

    const sheetResponse = await fetch(sheetsUrl, {
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
    return res.status(200).json({ success: true, message: 'Transaction recorded successfully.' });

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
