import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { accountNumber, type, amount } = req.body;
    
    if (!accountNumber || !type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      return res.status(500).json({ error: 'Missing Server Credentials' });
    }
    const credentials = JSON.parse(credentialsStr);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Full access to write
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';

    // Format timestamp: YYYY-MM-DD HH:mm:ss
    const now = new Date();
    // Use Sweden locale for ISO-like format (YYYY-MM-DD HH:mm:ss) without the T
    const timestamp = now.toLocaleString('sv-SE').replace('T', ' '); 
    const runningBalance = 'PENDING'; // Dynamic calculation to be implemented next
    const status = 'SUCCESS';

    const appendData = {
      values: [
        [timestamp, accountNumber, type, amount, runningBalance, status]
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
    console.error('Sheets API Error:', error);
    return res.status(500).json({ error: 'Failed to record transaction.' });
  }
}
