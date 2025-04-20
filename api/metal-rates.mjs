// Fetch metal rates from a public Google Sheet using the Google Visualization API

const SHEET_ID = '1YpeV4GpJeedrYGHQgonuSL-Rf4kuQiwpPysdZL9B-vk';
const SHEET_NAME = 'METAL RATE'; // Ensure this matches your actual tab name
const RANGE = 'A2:B2'; // Gold: A2, Silver: B2

// Construct the Google Visualization API URL
const sheetNameEncoded = encodeURIComponent(SHEET_NAME);
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetNameEncoded}&range=${RANGE}`;

// Simple in-memory cache
let cache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes cache (as requested base data refresh)

async function fetchAndParseSheetData() {
  console.log(`Fetching public sheet data from: ${GVIZ_URL}`);
  let response;
  let rawText = '[Not Fetched]';
  try {
    response = await fetch(GVIZ_URL);
    rawText = await response.text(); // Get text content for parsing/debugging

    if (!response.ok) {
      throw new Error(`HTTP error fetching sheet data! Status: ${response.status}. Response: ${rawText.substring(0, 200)}`);
    }

    // Extract JSON from the GVIZ response format
    const jsonString = rawText.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)?.[1];
    if (!jsonString) {
      console.error("Could not extract JSON from GVIZ response:", rawText.substring(0, 500));
      throw new Error('Invalid response format from Google Visualization API.');
    }

    const json = JSON.parse(jsonString);

    if (json.status === 'error') {
      console.error("Google Visualization API returned an error object:", json.errors);
      throw new Error(`GVIZ API Error: ${json.errors.map(e => e.detailed_message || e.message).join('; ')}`);
    }

    // Extract data safely
    const goldRate = json.table?.rows?.[0]?.c?.[0]?.v?.toString() ?? "N/A";
    const silverRate = json.table?.rows?.[0]?.c?.[1]?.v?.toString() ?? "N/A";

    console.log(`Fetched public rates - Gold: ${goldRate}, Silver: ${silverRate}`);
    return { goldRate, silverRate };

  } catch (error) {
    console.error('Error fetching or parsing public sheet data:', error);
    throw new Error(`Failed to get public sheet data: ${error.message}`);
  }
}

// Vercel Serverless Function handler (ESM)
export default async (req, res) => {
  const now = Date.now();

  // --- Caching Logic ---
  if (cache.data && !cache.data.error && now - cache.timestamp < CACHE_DURATION_MS) {
    console.log("Returning cached data.");
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(cache.data);
  }

  // --- Fetch Fresh Data ---
  console.log("Cache expired or empty/error, fetching fresh public data...");
  try {
    const data = await fetchAndParseSheetData();
    cache = { data: data, timestamp: now };
    console.log("Successfully fetched fresh public data, updating cache.");
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error processing /api/metal-rates request:", error.message);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || "An internal server error occurred.",
      goldRate: cache.data?.goldRate || "Error",
      silverRate: cache.data?.silverRate || "Error"
    });
  }
}; 