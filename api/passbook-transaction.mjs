import * as jose from 'jose';

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
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    // Normalize email
    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    
    // Decode the perfect, uncorrupted Private Key from Base64
    const privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

    // Import the private key into a subtle crypto object using jose
    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    // Create the JWT token payload exactly how Google expects it
    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets' // Full scope for writing
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
