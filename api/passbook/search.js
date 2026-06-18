import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { query } = req.query || {};
    
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
        range: 'CUSTOMER_PROFILES!A2:G', 
      });
    } catch (apiError) {
      console.error('Google Sheets API Fetch Error:', apiError);
      return res.status(200).json({ data: [] }); // Safe fallback
    }

    const rows = (response && response.data && response.data.values) ? response.data.values : [];
    
    // Map rows cleanly to JSON objects with safety fallbacks
    let customers = rows.map(row => ({
      accountNumber: row[0] || 'UNKNOWN_ACC',
      customerName: row[1] || 'Unknown Customer',
      fathersName: row[2] || 'Unknown Father',
      village: row[3] || 'Unknown Location',
      phone: row[4] || 'N/A',
      photoLink: row[5] || '',
      faceVector: row[6] || ''
    }));

    // Filter if text query is provided
    if (query && typeof query === 'string') {
      const lowerQuery = query.toLowerCase();
      customers = customers.filter(c => 
        (c.customerName || '').toLowerCase().includes(lowerQuery) ||
        (c.fathersName || '').toLowerCase().includes(lowerQuery) ||
        (c.phone || '').includes(lowerQuery) ||
        (c.accountNumber || '').toLowerCase().includes(lowerQuery)
      );
    }

    return res.status(200).json({ data: customers });

  } catch (error) {
    console.error('Unhandled Server Error in Search Proxy:', error);
    return res.status(200).json({ data: [] });
  }
}
