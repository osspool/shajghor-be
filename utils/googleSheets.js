// utils/googleSheets.js
import dotenv from "dotenv";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on environment
const env = process.env.ENV || "dev";
dotenv.config({ path: `.env.${env}` });

/**
 * Creates an authorized Google Sheets API client
 * @returns {Promise<Object>} The Google Sheets API client
 */
export async function getGoogleSheetsClient() {
    try {
        // Create credentials object from environment variables
        const credentials = {
            type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
            project_id: process.env.GOOGLE_SERVICE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_SERVICE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_SERVICE_PRIVATE_KEY.replace(
                /\\n/g,
                "\n"
            ),
            client_email: process.env.GOOGLE_SERVICE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_SERVICE_CLIENT_ID,
            auth_uri: process.env.GOOGLE_SERVICE_AUTH_URI,
            token_uri: process.env.GOOGLE_SERVICE_TOKEN_URI,
            auth_provider_x509_cert_url:
                process.env.GOOGLE_SERVICE_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.GOOGLE_SERVICE_CLIENT_CERT_URL,
            universe_domain: process.env.GOOGLE_SERVICE_UNIVERSE_DOMAIN,
        };

        // Create a Google Auth client using credentials from env
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        // Create Google Sheets client
        return google.sheets({ version: "v4", auth });
    } catch (error) {
        console.error("Error initializing Google Sheets client:", error);
        throw error;
    }
}

/**
 * Reads data from a Google Sheet
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @param {string} range - The range to read (e.g. 'Sheet1!A1:C10')
 * @returns {Promise<Array>} The values from the sheet
 */
export async function readSheet(spreadsheetId, range) {
    try {
        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values;
    } catch (error) {
        console.error("Error reading Google Sheet:", error);
        throw error;
    }
}

/**
 * Gets metadata about a spreadsheet
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @returns {Promise<Object>} Spreadsheet metadata
 */
export async function getSpreadsheetInfo(spreadsheetId) {
    try {
        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        return response.data;
    } catch (error) {
        console.error("Error getting spreadsheet info:", error);
        throw error;
    }
}

/**
 * Convert a column letter (e.g., 'A', 'AB') to a 1-based index.
 */
export function columnLetterToIndex(letter) {
  if (typeof letter !== 'string') return -1;
  let index = 0;
  const chars = letter.toUpperCase().trim();
  for (let i = 0; i < chars.length; i++) {
    index = index * 26 + (chars.charCodeAt(i) - 64);
  }
  return index;
}

/**
 * Get a cell value from a row array by column letter (e.g., 'A', 'B').
 */
export function getValueByColumnLetter(rowArray, letter) {
  const idx = columnLetterToIndex(letter);
  // Convert to 0-based index
  return Array.isArray(rowArray) && idx > 0 && idx <= rowArray.length
    ? rowArray[idx - 1]
    : undefined;
}

/**
 * Log values for a given row array using a column map of field keys to letters.
 * { id: 'A', stockx_sku: 'C', ... }
 */
export function logRowValuesByColumnMap(rowArray, columnMap) {
  if (!rowArray || typeof columnMap !== 'object') return;
  Object.entries(columnMap).forEach(([fieldKey, letter]) => {
    const value = getValueByColumnLetter(rowArray, letter);
    console.log(`${fieldKey} (${letter}):`, value);
  });
}
