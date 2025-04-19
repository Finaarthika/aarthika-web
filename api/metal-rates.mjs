// No longer needed: import { GoogleAuth } from 'google-auth-library';
// No longer needed: import { google } from 'googleapis';

const SHEET_ID = '1YpeV4GpJeedrYGHQgonuSL-Rf4kuQiwpPysdZL9B-vk';
const SHEET_NAME = 'METAL RATE'; // Ensure this matches your actual tab name
const RANGE = 'A2:B2'; // Gold: A2, Silver: B2

// Construct the Google Visualization API URL
// Note: Sheet name needs to be URL encoded if it contains spaces or special characters
const sheetNameEncoded = encodeURIComponent(SHEET_NAME);
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetNameEncoded}&range=${RANGE}`;

// Main Vercel serverless function handler (ESM)
export default async (req, res) => {
  console.log("--- New Request --- ");
  console.log(`Attempting to fetch: ${GVIZ_URL}`);

  let response;
  let rawText = '[Not Fetched]';
  let status = 0;

  try {
    // Make the fetch call
    response = await fetch(GVIZ_URL);
    status = response.status;
    console.log(`Fetch completed. Status: ${status}`);

    // Try to get text content regardless of status for logging
    try {
        rawText = await response.text();
        console.log(`Response Text (first 100 chars): ${rawText.substring(0, 100)}...`);
    } catch (textError) {
        console.error("Error reading response text:", textError);
        rawText = "[Error reading text]";
    }

    // Check if the fetch was successful (status 2xx)
    if (!response.ok) {
      // Throw error including status and any text we could read
      throw new Error(`HTTP error! Status: ${status}. Response: ${rawText.substring(0, 200)}`);
    }

    // --- Parsing Logic ---
    const jsonString = rawText.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)?.[1];
    if (!jsonString) {
      console.error("Could not extract JSON from GVIZ response.");
      throw new Error('Invalid response format from Google Visualization API.');
    }

    const json = JSON.parse(jsonString);
    if (json.status === 'error') {
      console.error("Google Visualization API returned an error object:", json.errors);
      throw new Error(`GVIZ API Error: ${json.errors.map(e => e.detailed_message || e.message).join('; ')}`);
    }

    // --- Data Extraction ---
    const goldRate = json.table?.rows?.[0]?.c?.[0]?.v ?? "N/A";
    const silverRate = json.table?.rows?.[0]?.c?.[1]?.v ?? "N/A";
    console.log(`Successfully parsed rates - Gold: ${goldRate}, Silver: ${silverRate}`);

    // --- Success Response ---
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ goldRate, silverRate });

  } catch (error) {
    // --- Error Response ---
    // Log the specific error encountered
    console.error("Error during fetch or processing:", error);
    // Get the message from the caught error
    const errorMessage = error.message || "An internal server error occurred."; 
    // Log potentially useful context captured before the error
    console.error(`Fetch Status Code before error (if available): ${status}`);
    console.error(`Raw text received before error (if any): ${rawText.substring(0, 500)}`); 

    res.setHeader('Content-Type', 'application/json');
    // Send the specific error message back to the client
    res.status(500).json({ 
      error: errorMessage,
      // Include potentially useful debug info
      fetchStatus: status, 
      goldRate: "Error",
      silverRate: "Error"
    });
  }
}; 