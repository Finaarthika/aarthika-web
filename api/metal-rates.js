const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

const SHEET_ID = '1YpeV4GpJeedrYGHQgonuSL-Rf4kuQiwpPysdZL9B-vk';
const SHEET_NAME = 'METAL RATE'; // Ensure this matches your actual tab name
const GOLD_CELL = 'A2';
const SILVER_CELL = 'B2';
const RANGE = `${SHEET_NAME}!${GOLD_CELL}:${SILVER_CELL}`; // Range covering both cells

// Simple in-memory cache
let cache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

async function getSheetData() {
  // --- Authentication ---
  // IMPORTANT: Set these environment variables in your Vercel project settings
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'); // Handle escaped newlines
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    console.error("Missing GOOGLE_PRIVATE_KEY or GOOGLE_CLIENT_EMAIL environment variables.");
    throw new Error("Server configuration error: Missing Google credentials.");
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // --- Fetch Data ---
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const values = response.data.values;
    if (!values || values.length === 0 || !values[0] || values[0].length < 2) {
      console.error("Could not parse sheet data or cells are empty:", values);
      throw new Error("Could not retrieve metal rates from the sheet.");
    }

    // Assuming A2 is gold, B2 is silver
    const goldRate = values[0][0] || "N/A"; // Default to N/A if cell is empty
    const silverRate = values[0][1] || "N/A";

    return { goldRate, silverRate };

  } catch (err) {
    console.error('The API returned an error: ' + err);
    throw new Error('Failed to fetch data from Google Sheets.');
  }
}

module.exports = async (req, res) => {
  const now = Date.now();

  // --- Caching Logic ---
  if (cache.data && now - cache.timestamp < CACHE_DURATION_MS) {
    // Return cached data
    res.status(200).json(cache.data);
    return;
  }

  // --- Fetch Fresh Data ---
  try {
    const data = await getSheetData();
    // Update cache
    cache = {
      data: data,
      timestamp: now,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in serverless function:", error);
    // Return the previous cache data if fetch fails, otherwise return error
    if (cache.data) {
      res.status(200).json({ ...cache.data, error: "Failed to update rates, showing last known values." });
    } else {
       res.status(500).json({ error: error.message || "Failed to fetch metal rates." });
    }
  }
}; 