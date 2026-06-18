import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { query } = req.query;
    
    // Parse the service account key from Vercel environment variable
    const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      return res.status(500).json({ error: 'Missing Server Credentials: GOOGLE_SERVICE_ACCOUNT_KEY' });
    }
    
    const credentials = JSON.parse(credentialsStr);

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    
    // Fetch data from CUSTOMER_PROFILES tab
    // Column Schema: A: Account Number, B: Full Name, C: Father's Name, D: Village/Area, E: Phone Number, F: Profile Photo, G: Face Vector
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'CUSTOMER_PROFILES!A2:G', // Skip header row
    });

    const rows = response.data.values || [];
    
    // Map rows cleanly to JSON objects
    let customers = rows.map(row => ({
      accountNumber: row[0] || '',
      customerName: row[1] || '',
      fathersName: row[2] || '',
      village: row[3] || '',
      phone: row[4] || '',
      photoLink: row[5] || '',
      faceVector: row[6] || ''
    }));

    // Filter if text query is provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      customers = customers.filter(c => 
        c.customerName.toLowerCase().includes(lowerQuery) ||
        c.fathersName.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(lowerQuery) ||
        c.accountNumber.toLowerCase().includes(lowerQuery)
      );
    }

    return res.status(200).json({ data: customers });

  } catch (error) {
    console.error('Sheets API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer profiles.' });
  }
}
