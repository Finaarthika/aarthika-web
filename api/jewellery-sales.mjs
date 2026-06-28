import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      invoiceNo,
      date,
      officerName,
      customerName,
      customerPhone,
      customerVillage,
      items,
      metalValue,
      goldMakingCharges,
      silverMakingCharges,
      gstAmount,
      discount,
      grandTotal,
      linkedAdvanceAmount,
      linkedAdvanceDate,
      creditAmount,
      finalPaid,
      faceVectorStr,
      goldRate,
      silverRate,
      totalGoldNetWeight,
      totalSilverNetWeight,
      vaultPdfFile,
      creditPdfFile
    } = req.body || {};

    if (req.method === 'POST') {
      if (!invoiceNo || !customerName) {
        return res.status(400).json({ error: 'Invoice No and Customer Name are required.' });
      }
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

    const DRIVE_FOLDER_ID = '1Xo3g-xTVJqBuH3OcnwsBZRW1VhIdhA8F';
    const SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
    const SHEET_NAME = 'JEWELLERY_SALES';

    if (req.method === 'GET') {
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:AN`;
      const sheetResponse = await fetch(sheetsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!sheetResponse.ok) {
        const errorText = await sheetResponse.text();
        throw new Error(`Google Sheets API responded with status ${sheetResponse.status}: ${errorText}`);
      }

      const data = await sheetResponse.json();
      const rows = data.values || [];

      const customers = rows.map(row => {
        let items = [];
        for (let i = 0; i < 6; i++) {
          const offset = 22 + (i * 3);
          if (row[offset] && String(row[offset]).trim() !== '') {
            items.push({
              name: String(row[offset]).trim(),
              weight: String(row[offset + 1] || '').trim(),
              purity: String(row[offset + 2] || '').trim()
            });
          }
        }
        return {
          invoiceNo: row[0] ? String(row[0]).trim() : '',
          date: row[1] ? String(row[1]).trim() : '',
          customerName: row[2] ? String(row[2]).trim() : '',
          village: row[3] ? String(row[3]).trim() : '',
          phone: row[4] ? String(row[4]).trim() : '',
          faceVector: row[15] ? String(row[15]).trim() : '',
          items: items
        };
      }).filter(c => {
        return c.customerName !== '' && c.faceVector !== '';
      });

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ data: customers });
    }

    let vaultPdfLink = '';
    let creditPdfLink = '';

    // Upload Vault PDF to Google Drive
    if (vaultPdfFile) {
      const boundary = 'foo_bar_baz_pdf';
      const metadata = {
        name: `${invoiceNo}_Vault_Record.pdf`,
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
      
      const pdfBuffer = Buffer.from(vaultPdfFile, 'base64');
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
        vaultPdfLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      }
    }

    // Upload Credit Agreement PDF to Google Drive if provided
    if (creditPdfFile) {
      const boundary = 'foo_bar_baz_credit_pdf';
      const metadata = {
        name: `${invoiceNo}_Credit_Agreement.pdf`,
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
      
      const pdfBuffer = Buffer.from(creditPdfFile, 'base64');
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
        creditPdfLink = `https://drive.google.com/file/d/${driveData.id}/view`;
      }
    }

    // Construct 41 Columns for Sheet
    const itemDescription = (items || []).map(i => `${i.metalType} ${i.category}`).join(', ');
    const combinedMakingCharges = (parseFloat(goldMakingCharges) || 0) + (parseFloat(silverMakingCharges) || 0);

    const safeStr = (val) => String(val || '').trim();
    const safeNum = (val) => String(val || '0').trim();

    const rowData = [
      safeStr(invoiceNo),                           // 1. Invoice No.
      safeStr(date),                                // 2. Date
      safeStr(customerName),                        // 3. Customer Name
      safeStr(customerVillage),                     // 4. Village
      safeStr(customerPhone),                       // 5. Contact
      safeStr(itemDescription),                     // 6. Item Description
      safeNum(metalValue),                          // 7. Metal Value
      safeNum(combinedMakingCharges),               // 8. Making Charge (Combined)
      safeNum(gstAmount),                           // 9. GST Amount
      safeNum(discount),                            // 10. Discount
      safeNum(linkedAdvanceAmount),                 // 11. Advance Paid
      safeStr(linkedAdvanceDate),                   // 12. Advance Date
      safeNum(creditAmount),                        // 13. Credit Due
      safeStr(creditPdfLink),                       // 14. Credit Agreement PDF Link
      safeNum(finalPaid),                           // 15. Total Paid
      safeStr(faceVectorStr),                       // 16. Face Code Vector
      safeStr(vaultPdfLink),                        // 17. PDF Bill Link
      safeStr(officerName),                         // 18. Officer Name
      safeNum(goldRate),                            // 19. Gold Rate/g
      safeNum(silverRate),                          // 20. Silver Rate/g
      safeNum(totalGoldNetWeight),                  // 21. Gold Net Weight
      safeNum(totalSilverNetWeight),                // 22. Silver Net Weight
    ];

    // Items 1 to 6 (Columns 23 to 40)
    for (let i = 0; i < 6; i++) {
      if (items && items[i]) {
        rowData.push(
          safeStr(`${items[i].metalType} ${items[i].category}`), // Name
          safeNum(items[i].netWeight),                           // Wt
          safeStr(items[i].purity)                               // Purity
        );
      } else {
        rowData.push('', '', '');
      }
    }

    // 41. Grand Total
    rowData.push(safeNum(grandTotal));

    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${SHEET_NAME}'!A:A:append?valueInputOption=USER_ENTERED`;
    
    const appendData = {
      values: [rowData]
    };

    const sheetResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appendData)
    });

    if (!sheetResponse.ok) {
      const errText = await sheetResponse.text();
      throw new Error(`Sheets Append Failed: ${sheetResponse.status} - ${errText}`);
    }

    return res.status(200).json({ success: true, invoiceNo, message: 'Sale Recorded & PDF Vaulted' });

  } catch (error) {
    console.error('Jewellery Sales Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
