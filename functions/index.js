const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const jose = require("jose");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Global Spreadsheet IDs used in the system
const DB_SHEET_ID = '1G1Q-OcKpk3iQ_yHi8Ec0sKYApqxquffSD4oS-e6Mvmo';
const STAFF_SHEET_ID = '1Vu4mOrQhee8mw-kmhrTsSrjS3IeJuY2Zjb04DpwDKt8';
const METAL_RATES_ID = '1YpeV4GpJeedrYGHQgonuSL-Rf4kuQiwpPysdZL9B-vk';
const PASSBOOK_ID = '14ujzie7cQjDxKVVXpmE5kKUJxNMBouf4c8F_I9AnlJw';

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

    if (!tokenResponse.ok) throw new Error('Token Exchange Failed');
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

// 1. Universal Read Endpoint
app.get('/read', async (req, res) => {
    try {
        const { target } = req.query;
        const accessToken = await getAccessToken();

        let sheetId, range;

        switch (target) {
            case 'inventory':
                sheetId = DB_SHEET_ID; range = 'INVENTORY!A:L'; break;
            case 'custom-orders':
                sheetId = DB_SHEET_ID; range = 'CUSTOM_ORDER!A:Y'; break;
            case 'jewellery-sales':
                sheetId = DB_SHEET_ID; range = 'JEWELLERY_SALES!A:AN'; break;
            case 'old-jewellery':
                sheetId = DB_SHEET_ID; range = 'OLD_JEWELLERY_PURCHASE!A:AE'; break;
            case 'vault-audit':
                sheetId = DB_SHEET_ID; range = 'AUDIT_LOGS!A:Z'; break;
            case 'metal-rates':
                sheetId = METAL_RATES_ID; range = 'METAL RATE!A:E'; break;
            case 'staff-access':
                sheetId = STAFF_SHEET_ID; range = 'StaffAccess!A:I'; break;
            case 'customer-profiles':
                sheetId = PASSBOOK_ID; range = 'CUSTOMER_PROFILES!A:I'; break;
            case 'transaction-ledger':
                sheetId = PASSBOOK_ID; range = 'TRANSACTION_LEDGER!A:I'; break;
            case 'savings-transaction':
                sheetId = PASSBOOK_ID; range = 'SAVINGS_TRANSACTION!A:H'; break;
            case 'inventory-addition':
                sheetId = DB_SHEET_ID; range = 'INVENTORY_ADDITION!A:K'; break;
            default:
                return res.status(400).json({ error: 'Invalid target' });
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

// 2. Add/Update Inventory Endpoint
app.post('/add-inventory', async (req, res) => {
    try {
        const { category, addedCount, addedWeight } = req.body;
        const accessToken = await getAccessToken();

        // 1. Fetch current inventory to find the row
        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}/values/INVENTORY!A:I`;
        const readRes = await fetch(readUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!readRes.ok) throw new Error("Failed to read inventory");
        const readData = await readRes.json();
        const rows = readData.values || [];
        
        // Find the row with the matching category name (Column A)
        let rowIndex = -1;
        let currentAddedCount = 0;
        let currentAddedWeight = 0;
        
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === category) {
                rowIndex = i + 1; // Google Sheets is 1-indexed
                currentAddedCount = parseInt(rows[i][7] || 0) || 0; // Col H (Index 7)
                currentAddedWeight = parseFloat(rows[i][8] || 0) || 0; // Col I (Index 8)
                break;
            }
        }

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: "Category not found in Inventory sheet. Please add the category row first." });
        }

        // 2. Update the row with new values
        const newCount = currentAddedCount + parseInt(addedCount);
        const newWeight = currentAddedWeight + parseFloat(addedWeight);

        // Update Col H (Added Count) and Col I (Added Weight)
        const updateRange = `INVENTORY!H${rowIndex}:I${rowIndex}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`;

        const updateRes = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [[newCount, newWeight]]
            })
        });

        if (!updateRes.ok) throw new Error(await updateRes.text());
        
        return res.status(200).json({ success: true, message: 'Inventory updated successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

exports.masterApi = onRequest(app);
