// src/config/sections/google.config.js
import { requiredEnv } from '../utils.js'; // Assume utils file created below

// Validate the single encoded key is present
requiredEnv("GOOGLE_CLOUD_KEY_ENCODED");

let googleServiceAccount = null;
const encodedKey = process.env.GOOGLE_CLOUD_KEY_ENCODED;

try {
    const jsonString = Buffer.from(encodedKey, 'base64').toString('utf8');
    googleServiceAccount = JSON.parse(jsonString);

    // Basic validation of parsed JSON structure
    if (!googleServiceAccount || typeof googleServiceAccount !== 'object' ||
        !googleServiceAccount.private_key || !googleServiceAccount.client_email) {
        console.error("FATAL ERROR: Decoded Google Service Account JSON is invalid or incomplete.");
        googleServiceAccount = null; // Ensure it's null if invalid
        process.exit(1);
    }
     console.log("Successfully decoded and parsed Google Service Account credentials.");

} catch (error) {
    console.error("FATAL ERROR: Failed to decode or parse GOOGLE_CLOUD_KEY_ENCODED:", error);
    googleServiceAccount = null; // Ensure it's null on error
    process.exit(1); // Exit as credentials are essential
}


export default {
    google: {
        serviceAccount: googleServiceAccount, // Use the parsed object
    }
};