import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'POST') {
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
      throw new Error(`Token Exchange Failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const sheetId = '1Vu4mOrQhee8mw-kmhrTsSrjS3IeJuY2Zjb04DpwDKt8';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/StaffAccess!B3:K100`;

    const sheetResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!sheetResponse.ok) {
      throw new Error(`Google Sheets API responded with status ${sheetResponse.status}`);
    }

    const data = await sheetResponse.json();
    const rows = data.values || [];

    // Parse incoming credentials
    let body = {};
    if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
    } else {
        body = req.body || {};
    }

    const reqAction = String(body.action || 'login'); // 'login' or 'check'
    const reqUserId = String(body.userId || '').trim();
    const reqPassword = String(body.password || '').trim();
    const reqDeviceId = String(body.deviceId || '').trim();

    if (!reqUserId || (!reqPassword && reqAction === 'login') || !reqDeviceId) {
        return res.status(400).json({ authorized: false, error: 'User ID, Password, and Device ID are required.' });
    }

    // Find user in the sheet
    // B=0 (ID), C=1 (Name), D=2 (Password), E=3 (OverallAccess), F=4, G=5, H=6 (Passbook), I=7 (DeviceID), J=8 (JewelleryPOS), K=9 (AdminDashboard)
    let foundUser = null;
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const id = row[0] ? String(row[0]).trim() : '';
        
        if (id === reqUserId) {
            const pass = row[2] ? String(row[2]).trim() : '';
            // For 'login', password must match. For 'check', we trust the device ID and sentinel.
            if (reqAction === 'login' && pass !== reqPassword) continue;

            foundUser = {
                userId: id,
                staffName: row[1] ? String(row[1]).trim() : '',
                overallAccess: row[3] ? String(row[3]).trim() : '',
                passbookAccess: row[6] ? String(row[6]).trim() : '',
                jewelleryPosAccess: row[8] ? String(row[8]).trim() : '',
                adminDashboardAccess: row[9] ? String(row[9]).trim() : '',
                boundDeviceId: row[7] ? String(row[7]).trim() : ''
            };
            rowIndex = i + 3; // +3 because range starts at B3
            break;
        }
    }

    if (!foundUser) {
        return res.status(401).json({ authorized: false, reason: 'Invalid credentials' });
    }

    if (foundUser.overallAccess.toLowerCase() !== 'access') {
        return res.status(403).json({ authorized: false, reason: 'System Access Completely Revoked' });
    }

    // Hardware Binding Check
    if (reqAction === 'login') {
        if (foundUser.boundDeviceId && foundUser.boundDeviceId !== reqDeviceId) {
            return res.status(403).json({ 
                authorized: false, 
                reason: 'Hardware Mismatch: These credentials are locked to a different authorized branch computer.' 
            });
        }

        // If no device is bound, bind this device to Column I
        if (!foundUser.boundDeviceId) {
            const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/StaffAccess!I${rowIndex}?valueInputOption=USER_ENTERED`;
            await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [[reqDeviceId]]
                })
            });
        }
    } else if (reqAction === 'check') {
        // Sentinel check ensures the device ID still matches what's in the sheet
        if (foundUser.boundDeviceId !== reqDeviceId) {
            return res.status(403).json({ 
                authorized: false, 
                reason: 'Hardware Mismatch: Session invalidated by another device lock.' 
            });
        }
    }

    // Fully authorized
    return res.status(200).json({ 
        authorized: true, 
        staffName: foundUser.staffName,
        userId: foundUser.userId,
        passbookAccess: foundUser.passbookAccess,
        jewelleryPosAccess: foundUser.jewelleryPosAccess,
        adminDashboardAccess: foundUser.adminDashboardAccess
    });

  } catch (err) {
    console.error(err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
