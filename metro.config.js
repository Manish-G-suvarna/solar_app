const { getDefaultConfig } = require('expo/metro-config');

// NOTE: Run the ESP32 bridge separately: npm run bridge
// (Removed auto-start — process.exit inside bridge was killing Metro)

const config = getDefaultConfig(__dirname);

module.exports = config;

