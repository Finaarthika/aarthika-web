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
      return res.status(500).json({ 
        error: apiError.message, 
        stack: apiError.stack,
        details: 'Check if sheet is shared with service account, or if tab name TRANSACTION_LEDGER has typos/trailing spaces.'
      });
    }

    const rows = (response && response.data && response.data.values) ? response.data.values : [];
    
    const safeAccountNumber = String(accountNumber).trim();

    const accountRows = rows.filter(row => {
      const acct = row[1] ? String(row[1]).trim() : '';
      return acct === safeAccountNumber;
    });

    let transactions = accountRows.map((row, index) => {
      const timestamp = row[0] ? String(row[0]).trim() : '';
      const type = row[2] ? String(row[2]).trim() : '';
      const amount = row[3] ? String(row[3]).trim() : '';
      const runningBalance = row[4] ? String(row[4]).trim() : '';
      const status = row[5] ? String(row[5]).trim() : '';
      
      return {
        id: index,
        timestamp,
        type,
        amount,
        runningBalance,
        status
      };
    });

    transactions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return res.status(200).json({ data: transactions });

  } catch (error) {
    console.error('Unhandled Server Error in Ledger Proxy:', error);
    return res.status(500).json({ 
      error: error.message, 
      stack: error.stack,
      details: 'Check if sheet is shared with service account or if credentials variable parses correctly'
    });
  }
}
