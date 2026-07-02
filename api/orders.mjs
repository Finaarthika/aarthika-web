import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    let privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    privateKeyString = privateKeyString.replace(/\\n/g, '\n').trim();

    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token Exchange Failed: ${tokenResponse.status} - ${errText}`);
    }

    const { access_token: accessToken } = await tokenResponse.json();
    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'CUSTOM_ORDER';

    // GET: Fetch Open Orders
    if (req.method === 'GET') {
      const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A:Y`;
      const getRes = await fetch(getUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!getRes.ok) {
         const err = await getRes.text();
         throw new Error(`Failed to fetch sheet: ${err}`);
      }

      const getData = await getRes.json();
      const rows = getData.values || [];
      
      if (rows.length < 2) {
         return res.status(200).json({ openOrders: [] });
      }
      
      const openOrders = [];
      
      const parseDDMMYYYY = (dateStr) => {
          if (!dateStr) return null;
          const parts = dateStr.split('/');
          if (parts.length === 3) {
              return new Date(parts[2], parts[1] - 1, parts[0]);
          }
          return null;
      };

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const checkBox = String(row[0] || '').trim().toUpperCase();
          
          if (checkBox !== 'TRUE') {
              const orderId = row[1];
              if (!orderId) continue;
              
              const expectedDeliveryStr = row[11];
              let status = 'ON TRACK';
              let deliveryObj = parseDDMMYYYY(expectedDeliveryStr);
              let diffDays = null;

              if (deliveryObj) {
                  const diffTime = deliveryObj.getTime() - todayDate.getTime();
                  diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0) {
                      status = 'OVERDUE';
                  } else if (diffDays <= 5) {
                      status = 'DUE SOON';
                  }
              } else {
                  status = 'NO DEADLINE';
              }

              const itemsList = [];
              for(let j=0; j<6; j++){
                 const typeCol = 13 + (j*2);
                 const wtCol = 14 + (j*2);
                 if(row[typeCol] && String(row[typeCol]).trim() !== '') {
                    itemsList.push({ type: row[typeCol], weight: row[wtCol] });
                 }
              }

              openOrders.push({
                 rowIndex: i + 1,
                 orderId: orderId,
                 orderDate: row[2],
                 customerName: row[3],
                 customerPhone: row[4],
                 customerVillage: row[5],
                 totalItems: row[6],
                 advancePaid: row[7],
                 pdfLink: row[9],
                 processedBy: row[10],
                 expectedDelivery: expectedDeliveryStr,
                 diffDays: diffDays,
                 status: status,
                 goldsmith: row[12] || '',
                 items: itemsList
              });
          }
      }

      openOrders.sort((a, b) => {
         if (a.diffDays === null) return 1;
         if (b.diffDays === null) return -1;
         return a.diffDays - b.diffDays;
      });

      return res.status(200).json({ openOrders });
    }

    // POST: Update Order
    if (req.method === 'POST') {
      const { action, rowIndex, goldsmithName } = req.body || {};

      if (!action || !rowIndex) {
        return res.status(400).json({ error: 'Action and RowIndex are required.' });
      }

      let updateData = [];

      if (action === 'assign_goldsmith') {
          if (!goldsmithName) {
               return res.status(400).json({ error: 'Goldsmith Name is required.' });
          }
          updateData.push({
              range: `'${SHEET_NAME}'!M${rowIndex}`,
              values: [[goldsmithName]]
          });
      } else if (action === 'fulfill_order') {
          const todayStr = new Date().toLocaleDateString('en-GB');
          updateData.push({
              range: `'${SHEET_NAME}'!A${rowIndex}`,
              values: [['TRUE']]
          });
          updateData.push({
              range: `'${SHEET_NAME}'!I${rowIndex}`,
              values: [[todayStr]]
          });
      } else {
          return res.status(400).json({ error: 'Invalid action.' });
      }

      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`;
      
      const requestBody = {
          valueInputOption: 'USER_ENTERED',
          data: updateData
      };

      const updateRes = await fetch(batchUpdateUrl, {
          method: 'POST',
          headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
      });

      if (!updateRes.ok) {
          const err = await updateRes.text();
          throw new Error(`Failed to update sheet: ${err}`);
      }

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Orders API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
