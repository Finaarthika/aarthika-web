import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      orderId,
      date,
      customerName,
      customerPhone,
      customerVillage,
      items,
      advancePaid,
      pdfBase64,
      staffName
    } = req.body || {};

    if (!orderId || !customerName) {
      return res.status(400).json({ error: 'Order ID and Customer Name are required.' });
    }

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
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive'
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

    const DRIVE_FOLDER_ID = '1H3Bi1jHya51wWur4hThGB4kYe60rmpZA';
    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'CUSTOM_ORDER';

    let pdfLink = '';

    // Upload PDF to Google Drive
    if (pdfBase64) {
      const boundary = 'foo_bar_baz_pdf';
      const metadata = {
        name: `${orderId}_Design_Internal.pdf`,
        parents: [DRIVE_FOLDER_ID],
        mimeType: 'application/pdf'
      };
      
      const headerBuffer = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) + `\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/pdf\r\n\r\n`
      );
      
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      const footerBuffer = Buffer.from(`\r\n--${boundary}--`);
      
      const multipartBody = Buffer.concat([headerBuffer, pdfBuffer, footerBuffer]);
      
      const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });
      
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        pdfLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      } else {
        console.error('Drive PDF upload failed:', await driveRes.text());
      }
    }

    // 2. Find the true last row by checking Column B (Order ID)
    // We search from top to bottom to find the FIRST empty gap. This fixes the issue where
    // previous orders were appended to the bottom (e.g. row 870) leaving rows 2-869 empty.
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!B:B`;
    const getRes = await fetch(getUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    let nextRow = 2; // Default to row 2
    if (getRes.ok) {
      const getData = await getRes.json();
      const bValues = getData.values || [];
      
      let foundEmpty = false;
      // Start from 1 to skip header (index 0 is Row 1)
      for (let i = 1; i < bValues.length; i++) {
        if (!bValues[i] || !bValues[i][0] || String(bValues[i][0]).trim() === '') {
          nextRow = i + 1; // i is 0-indexed, so row is i + 1
          foundEmpty = true;
          break;
        }
      }
      
      // If no empty row found in the middle, target the very bottom
      if (!foundEmpty) {
        nextRow = bValues.length + 1;
      }
    }
    
    // 3. Update the specific target row directly using PUT
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A${nextRow}:W${nextRow}?valueInputOption=USER_ENTERED`;
    
    const safeItems = Array.isArray(items) ? items : [];
    const itemSlots = [];
    
    // Fill up to 6 item slots
    for (let i = 0; i < 6; i++) {
      if (i < safeItems.length) {
        const item = safeItems[i];
        itemSlots.push(
          `${item.category || ''} - ${item.metalType || ''} ${item.purity || ''}`.trim(),
          String(item.expectedWeight || '0').trim()
        );
      } else {
        itemSlots.push('', ''); // Blank type and blank weight
      }
    }

    const appendData = {
      values: [
        [
          '',                                         // 1: Check Box
          orderId,                                    // 2: Order ID
          date,                                       // 3: Date
          String(customerName || '').trim(),          // 4: Customer Name
          String(customerPhone || '').trim(),         // 5: Contact
          String(customerVillage || '').trim(),       // 6: Village
          String(safeItems.length),                   // 7: Total Items
          String(advancePaid || '0').trim(),          // 8: Advance Paid
          '',                                         // 9: Date Of Fullfillment
          pdfLink,                                    // 10: PDF Link
          String(staffName || 'System'),              // 11: Processed By
          ...itemSlots                                // 12 to 23: Item 1-6 (Type/Wt)
        ]
      ]
    };

    let sheetResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appendData)
    });

    // 4. Fallback if the sheet is completely full and needs to grow
    // If PUT throws 400 (exceeds grid limits), we use append to grow the sheet.
    if (sheetResponse.status === 400) {
      const fallbackAppendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A:A:append?valueInputOption=USER_ENTERED`;
      sheetResponse = await fetch(fallbackAppendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appendData)
      });
    }

    if (!sheetResponse.ok) {
      const errText = await sheetResponse.text();
      throw new Error(`Sheets Sync Failed: ${errText}`);
    }

    return res.status(200).json({ success: true, orderId, pdfLink });

  } catch (error) {
    console.error('Custom Order Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
