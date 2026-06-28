// Fetch metal rates from a public Google Sheet using the Google Visualization API

const SHEET_ID = '1YpeV4GpJeedrYGHQgonuSL-Rf4kuQiwpPysdZL9B-vk';
const SHEET_NAME = 'METAL RATE'; 
const RANGE = 'A18:B23'; // Gold: A18, Silver: B18, Scrap Gold: A23, Scrap Silver: B23

// Construct the Google Visualization API URL
const sheetNameEncoded = encodeURIComponent(SHEET_NAME);
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetNameEncoded}&range=${RANGE}`;

// Simple in-memory cache
let cache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

async function fetchAndParseSheetData() {
  console.log(`Fetching public sheet data from: ${GVIZ_URL}`);
  let response;
  let rawText = '[Not Fetched]';
  try {
    response = await fetch(GVIZ_URL);
    rawText = await response.text(); 

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonString = rawText.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)?.[1];
    if (!jsonString) {
      throw new Error('Invalid response format from Google Visualization API.');
    }

    const json = JSON.parse(jsonString);

    if (json.status === 'error') {
      throw new Error(`GVIZ API Error: ${json.errors.map(e => e.detailed_message || e.message).join('; ')}`);
    }

    const goldRate = Math.round(parseFloat(json.table?.rows?.[0]?.c?.[0]?.v) || 0);
    const silverRate = Math.round(parseFloat(json.table?.rows?.[0]?.c?.[1]?.v) || 0);
    const goldMakingPerGram = parseFloat(json.table?.rows?.[1]?.c?.[0]?.v) || 0;
    const silverMakingPerGram = parseFloat(json.table?.rows?.[1]?.c?.[1]?.v) || 0;
    const goldHallmarking = parseFloat(json.table?.rows?.[2]?.c?.[0]?.v) || 0;
    const goldScrapRate = Math.round(parseFloat(json.table?.rows?.[5]?.c?.[0]?.v) || 0);
    const silverScrapRate = Math.round(parseFloat(json.table?.rows?.[5]?.c?.[1]?.v) || 0);

    return { goldRate, silverRate, goldMakingPerGram, silverMakingPerGram, goldHallmarking, goldScrapRate, silverScrapRate };

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