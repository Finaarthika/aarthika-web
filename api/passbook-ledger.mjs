import * as jose from 'jose';

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
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    // Normalize email
    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    
    // Decode the perfect, uncorrupted Private Key from Base64
    let privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    
    // Convert literal "\n" strings (from JSON copy-paste) back into actual structural newlines
    privateKeyString = privateKeyString.replace(/\\n/g, '\n').trim();

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

    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const range = 'TRANSACTION_LEDGER!A2:I';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

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
        status: row[5] ? String(row[5]).trim() : '',
        method: row[6] ? String(row[6]).trim() : 'CASH',
        formLink: row[7] ? String(row[7]).trim() : '',
        personLink: row[8] ? String(row[8]).trim() : ''
      };
    });

    // Sort descending by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    let currentNetBalance = '0.00';
    const latestSuccess = transactions.find(t => t.status === 'SUCCESS');
    if (latestSuccess && latestSuccess.runningBalance) {
      currentNetBalance = latestSuccess.runningBalance;
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
      data: transactions,
      currentNetBalance: currentNetBalance
    });

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
