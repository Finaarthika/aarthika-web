import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { accountNumber, type, amount } = req.body || {};
    
    if (!accountNumber || !type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      return res.status(500).json({ 
        error: 'Missing credentials', 
        details: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is missing.' 
      });
    }
    
    let credentials;
    try {
      credentials = JSON.parse(credentialsStr);
    } catch (e) {
      return res.status(500).json({ 
        error: e.message, 
        stack: e.stack, 
        details: 'Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON string.' 
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], 
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';

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

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'TRANSACTION_LEDGER!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: appendData,
      });
    } catch (apiError) {
      return res.status(500).json({ 
        error: apiError.message, 
        stack: apiError.stack,
        details: 'Check if sheet is shared with service account, or if tab name TRANSACTION_LEDGER has typos/trailing spaces.'
      });
    }

    return res.status(200).json({ success: true, message: 'Transaction recorded successfully.' });

  } catch (error) {
    console.error('Unhandled Server Error in Transaction Proxy:', error);
    return res.status(500).json({ 
      error: error.message, 
      stack: error.stack,
      details: 'Check if sheet is shared with service account or if credentials variable parses correctly'
    });
  }
}
