import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { accountNumber } = req.query;
    if (!accountNumber) {
      return res.status(400).json({ error: 'Account number is required' });
    }

    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      return res.status(500).json({ error: 'Missing Server Credentials' });
    }
    const credentials = JSON.parse(credentialsStr);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'TRANSACTION_LEDGER!A2:F',
    });

    const rows = response.data.values || [];
    
    // Filter by account number (Column B)
    const accountRows = rows.filter(row => row[1] === accountNumber);

    // Map to JSON objects
    let transactions = accountRows.map((row, index) => ({
      id: index,
      timestamp: row[0] || '',
      type: row[2] || '',
      amount: row[3] || '',
      runningBalance: row[4] || '',
      status: row[5] || ''
    }));

    // Sort chronologically (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({ data: transactions });

  } catch (error) {
    console.error('Sheets API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch ledger data.' });
  }
}
