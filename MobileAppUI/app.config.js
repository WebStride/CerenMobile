/* app.config.js
   Loads environment variables (from .env*. files) and injects them into the Expo config.
   This lets us avoid hard-coding API keys inside app.json.
*/

const fs = require('fs');
const path = require('path');

// load .env files
require('dotenv').config({ path: path.resolve(__dirname, '.env.development') });
require('dotenv').config();

const base = require('./app.json');

// Clone the base config so we don't mutate the original unexpectedly
const config = JSON.parse(JSON.stringify(base));

const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Ensure android config object exists
config.expo.android = config.expo.android || {};
config.expo.android.config = config.expo.android.config || {};
config.expo.android.config.googleMaps = config.expo.android.config.googleMaps || {};

if (googleMapsKey) {
  config.expo.android.config.googleMaps.apiKey = googleMapsKey;
}

// Ensure ios config object exists
config.expo.ios = config.expo.ios || {};
config.expo.ios.config = config.expo.ios.config || {};

if (googleMapsKey) {
  config.expo.ios.config.googleMapsApiKey = googleMapsKey;
}

// Also expose the key to the JS runtime via expo.extra so client-side
// code can call the Places web API (if needed). When you use EAS secrets
// you can still inject the secret into process.env at build time.
config.expo.extra = config.expo.extra || {};
if (googleMapsKey) {
  config.expo.extra.GOOGLE_MAPS_API_KEY = googleMapsKey;
}

module.exports = config;
