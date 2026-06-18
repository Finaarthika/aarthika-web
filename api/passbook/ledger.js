import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { accountNumber } = req.query || {};
    if (!accountNumber) {
      return res.status(400).json({ error: 'Account number is required' });
    }

    // Parse the service account key safely
    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_KEY');
      return res.status(200).json({ data: [] }); // Safe fallback
    }
    
    let credentials;
    try {
      credentials = JSON.parse(credentialsStr);
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', e);
      return res.status(200).json({ data: [] }); // Safe fallback
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'TRANSACTION_LEDGER!A2:F',
      });
    } catch (apiError) {
      console.error('Google Sheets API Fetch Error:', apiError);
      return res.status(200).json({ data: [] }); // Safe fallback
    }

    const rows = (response && response.data && response.data.values) ? response.data.values : [];
    
    const safeAccountNumber = String(accountNumber).trim();

    // Filter by account number cleanly and safely
    const accountRows = rows.filter(row => String(row[1] || '').trim() === safeAccountNumber);

    // Map to JSON objects with safety fallbacks
    let transactions = accountRows.map((row, index) => ({
      id: index,
      timestamp: String(row[0] || '').trim(),
      type: String(row[2] || '').trim(),
      amount: String(row[3] || '').trim(),
      runningBalance: String(row[4] || '').trim(),
      status: String(row[5] || '').trim()
    }));

    // Sort chronologically (newest first)
    transactions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return res.status(200).json({ data: transactions });

  } catch (error) {
    console.error('Unhandled Server Error in Ledger Proxy:', error);
    return res.status(200).json({ data: [] });
  }
}
