export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sheetId = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
    const tabName = 'CUSTOMER_PROFILES';
    // Using tqx=out:json ensures the response is wrapped in a JSONp callback we can parse
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&range=A2:G`;

    const response = await fetch(url);
    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`Google Sheets GVIZ API responded with status ${response.status}: ${rawText.substring(0, 200)}`);
    }

    // Extract JSON from the GVIZ response format
    const jsonString = rawText.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)?.[1];
    if (!jsonString) {
      throw new Error('Invalid response format from Google Visualization API.');
    }

    const json = JSON.parse(jsonString);

    if (json.status === 'error') {
      throw new Error(`GVIZ API Error: ${json.errors.map(e => e.detailed_message || e.message).join('; ')}`);
    }

    // Map rows safely from GVIZ schema: table.rows[].c[].v
    const rawRows = json.table?.rows || [];
    const customers = rawRows.map(row => {
      const cols = row.c || [];
      return {
        accountNumber: cols[0]?.v ? String(cols[0].v).trim() : '',
        customerName: cols[1]?.v ? String(cols[1].v).trim() : '',
        fathersName: cols[2]?.v ? String(cols[2].v).trim() : '',
        village: cols[3]?.v ? String(cols[3].v).trim() : '',
        phone: cols[4]?.v ? String(cols[4].v).trim() : '',
        photoLink: cols[5]?.v ? String(cols[5].v).trim() : '',
        faceVector: cols[6]?.v ? String(cols[6].v).trim() : '',
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
