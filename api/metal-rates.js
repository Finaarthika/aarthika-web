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
  console.log("Attempting to fetch sheet data...");
  // --- Authentication ---
  // IMPORTANT: Set these environment variables in your Vercel project settings
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'); // Handle escaped newlines
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  // Log environment variable status (avoid logging the key itself in production)
  console.log(`GOOGLE_CLIENT_EMAIL loaded: ${!!clientEmail}`);
  console.log(`GOOGLE_PRIVATE_KEY loaded: ${!!privateKey}`);

  if (!privateKey || !clientEmail) {
    console.error("Missing GOOGLE_PRIVATE_KEY or GOOGLE_CLIENT_EMAIL environment variables.");
    // Throw a specific error to be caught later
    throw new Error("Server configuration error: Missing Google credentials environment variables.");
  }

  let authClient;
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    authClient = await auth.getClient();
    console.log("Google Auth Client created successfully.");
  } catch (authError) {
    console.error("Google Authentication Error:", authError);
    throw new Error(`Google Authentication failed: ${authError.message}`);
  }

  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // --- Fetch Data ---
  try {
    console.log(`Fetching data from Sheet ID: ${SHEET_ID}, Range: ${RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });
    console.log("Successfully received response from Google Sheets API.");

    const values = response.data.values;
    if (!values || values.length === 0 || !values[0] || values[0].length < 2) {
      console.error("Could not parse sheet data or cells are empty. Received values:", values);
      throw new Error("Invalid data format received from Google Sheet.");
    }

    // Assuming A2 is gold, B2 is silver
    const goldRate = values[0][0] || "N/A"; // Default to N/A if cell is empty
    const silverRate = values[0][1] || "N/A";
    console.log(`Fetched rates - Gold: ${goldRate}, Silver: ${silverRate}`);

    return { goldRate, silverRate };

  } catch (apiError) {
    // Log the specific error from the Sheets API call
    console.error('Google Sheets API Error:', apiError.message);
    console.error('API Error Details:', apiError.response?.data?.error || apiError); // Log more details if available
    throw new Error(`Failed to fetch data from Google Sheets API: ${apiError.message}`);
  }
}

module.exports = async (req, res) => {
  const now = Date.now();

  // Allow CORS for local development (optional, remove if not needed)
  // res.setHeader('Access-Control-Allow-Origin', '*');
  // res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // if (req.method === 'OPTIONS') {
  //   return res.status(200).end();
  // }

  // --- Caching Logic ---
  if (cache.data && !cache.data.error && now - cache.timestamp < CACHE_DURATION_MS) {
    console.log("Returning cached data.");
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(cache.data);
    return;
  }

  // --- Fetch Fresh Data ---
  console.log("Cache expired or empty, fetching fresh data...");
  try {
    const data = await getSheetData();
    // Update cache
    cache = {
      data: data,
      timestamp: now,
    };
    console.log("Successfully fetched fresh data, updating cache.");
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (error) {
    // This catches errors from getSheetData (auth, API call, config)
    console.error("Error processing request in serverless function:", error.message);
    // Always return a JSON response
    res.setHeader('Content-Type', 'application/json');
    // Use a 500 status code for server errors
    res.status(500).json({ 
      error: error.message || "An internal server error occurred.",
      goldRate: cache.data?.goldRate || "Error", // Send stale data if available
      silverRate: cache.data?.silverRate || "Error"
    });
  }
}; 