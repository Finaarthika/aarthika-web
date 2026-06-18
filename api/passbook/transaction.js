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
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_KEY');
      return res.status(500).json({ error: 'Server configuration error: Missing credentials' });
    }
    
    let credentials;
    try {
      credentials = JSON.parse(credentialsStr);
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', e);
      return res.status(500).json({ error: 'Server configuration error: Invalid JSON payload' });
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

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'TRANSACTION_LEDGER!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: appendData,
    });

    return res.status(200).json({ success: true, message: 'Transaction recorded successfully.' });

  } catch (error) {
    console.error('Unhandled Server Error in Transaction Proxy:', error);
    return res.status(500).json({ error: 'Failed to record transaction due to server error.' });
  }
}
