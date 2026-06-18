export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const range = 'CUSTOMER_PROFILES!A2:G'; // Ensure A:G to catch all columns including face vectors
    
    // Fallback to GOOGLE_PRIVATE_KEY if GOOGLE_API_KEY isn't explicitly set, per user instruction
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PRIVATE_KEY; 

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is missing.');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Google Sheets API responded with status ${response.status}: ${JSON.stringify(data)}`);
    }

    const rows = data.values || [];

    // Map the returned data.values array safely with index guards
    const customers = rows.map(row => {
      return {
        accountNumber: row[0] ? String(row[0]).trim() : '',
        customerName: row[1] ? String(row[1]).trim() : '',
        fathersName: row[2] ? String(row[2]).trim() : '',
        village: row[3] ? String(row[3]).trim() : '',
        phone: row[4] ? String(row[4]).trim() : '',
        photoLink: row[5] ? String(row[5]).trim() : '',
        faceVector: row[6] ? String(row[6]).trim() : '',
      };
    }).filter(c => c.accountNumber !== '' || c.customerName !== '');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ data: customers });

  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
