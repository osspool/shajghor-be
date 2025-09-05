// src/config/env-loader.js - Load environment variables before any imports
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Determine environment
const env = process.env.NODE_ENV || process.env.ENV || "dev";
console.log("Current environment:", env);

// Function to handle the special case where MONGO_URI might be defined multiple times
function loadAndFixEnv(filePath) {
  try {
    // First, load the env file using dotenv
    dotenv.config({ path: filePath });   
   
  } catch (error) {
    console.error(`Error loading environment file ${filePath}:`, error);
  }
}

// Try to load the environment-specific .env file
const envFilePath = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFilePath)) {
  loadAndFixEnv(envFilePath);
} else {
  // Fall back to .env.dev if environment-specific file doesn't exist
  const defaultEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(defaultEnvPath)) {
    loadAndFixEnv(defaultEnvPath);
  } else {
    console.warn("No .env file found. Proceeding without environment file.");
  }
}

// For debugging purposes
console.log("Working directory:", process.cwd()); 