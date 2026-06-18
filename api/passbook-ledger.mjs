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
    throw new Error(`Failed to retrieve Google OAuth token for email [${clientEmail}]: ${tokenResponse.status} - ${errText}`);
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
    const { accountNumber } = req.query || {};
    if (!accountNumber) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Account number is required' });
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
    const range = 'TRANSACTION_LEDGER!A2:F';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

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

    const safeAccountNumber = String(accountNumber).trim();

    const accountRows = rows.filter(row => {
      const acct = row[1] ? String(row[1]).trim() : '';
      return acct === safeAccountNumber;
    });

    let transactions = accountRows.map((row, index) => {
      return {
        id: index,
        timestamp: row[0] ? String(row[0]).trim() : '',
        type: row[2] ? String(row[2]).trim() : '',
        amount: row[3] ? String(row[3]).trim() : '',
        runningBalance: row[4] ? String(row[4]).trim() : '',
        status: row[5] ? String(row[5]).trim() : ''
      };
    });

    // Sort descending by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ data: transactions });

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
