import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
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
        details: 'Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON string.' 
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'CUSTOMER_PROFILES!A2:E', 
    });

    const rows = (response && response.data && response.data.values) ? response.data.values : [];
    
    let customers = rows.map(row => {
      const accountNumber = row[0] ? String(row[0]).trim() : '';
      const customerName = row[1] ? String(row[1]).trim() : '';
      const fathersName = row[2] ? String(row[2]).trim() : '';
      const village = row[3] ? String(row[3]).trim() : '';
      const phone = row[4] ? String(row[4]).trim() : '';
      
      return {
        accountNumber,
        customerName,
        fathersName,
        village,
        phone
      };
    });

    customers = customers.filter(c => c.accountNumber !== '' || c.customerName !== '');

    return res.status(200).json({ data: customers });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message, 
      stack: error.stack,
      details: 'Google Sheets API error'
    });
  }
}
