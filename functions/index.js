const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const jose = require("jose");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to get Google Sheets access token
async function getAccessToken() {
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
        throw new Error('Token Exchange Failed');
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

// Global Spreadsheet IDs used in the system
const DB_SHEET_ID = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';
const STAFF_SHEET_ID = '1Vu4mOrQhee8mw-kmhrTsSrjS3IeJuY2Zjb04DpwDKt8';
const JEWELLERY_SHEET_ID = '112-L-B1q2e9KqGusL6K154PqJ6h0Hl0P84_4V1tN8aA';

// --- ROUTES ---

// 1. Universal Read Endpoint
app.get('/read', async (req, res) => {
    try {
        const { target } = req.query; // e.g. 'metal-rates', 'passbook', 'vault'
        const accessToken = await getAccessToken();

        let sheetId = DB_SHEET_ID;
        let range = '';

        if (target === 'metal-rates') {
            sheetId = STAFF_SHEET_ID; // Assuming metal rates are in staff sheet or specific one
            range = 'MetalRates!A2:E';
        } else if (target === 'passbook-ledger') {
            range = 'TRANSACTION_LEDGER!A2:I';
        } else if (target === 'orders') {
            sheetId = DB_SHEET_ID;
            range = 'CUSTOM_ORDERS!A2:M';
        } else if (target === 'inventory') {
            sheetId = JEWELLERY_SHEET_ID; // Assuming inventory goes to the main sales/jewellery DB
            range = 'INVENTORY!A2:J';
        } else {
            return res.status(400).json({ error: 'Invalid or missing target' });
        }

        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
        const sheetRes = await fetch(readUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
        });

        if (!sheetRes.ok) throw new Error(await sheetRes.text());
        const data = await sheetRes.json();
        
        return res.status(200).json({ success: true, data: data.values || [] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Add Inventory Endpoint
app.post('/add-inventory', async (req, res) => {
    try {
        const { itemCode, category, weight, purity, status, addedBy } = req.body;
        const accessToken = await getAccessToken();

        const appendRange = 'INVENTORY!A:F';
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${JEWELLERY_SHEET_ID}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`;

        const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace('T', ' ');
        
        const appendData = {
            values: [[timestamp, itemCode, category, weight, purity, status || 'AVAILABLE', addedBy]]
        };

        const sheetRes = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appendData)
        });

        if (!sheetRes.ok) throw new Error(await sheetRes.text());
        
        return res.status(200).json({ success: true, message: 'Inventory added successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

exports.masterApi = onRequest(app);
