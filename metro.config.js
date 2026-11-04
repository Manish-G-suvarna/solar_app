const { getDefaultConfig } = require('expo/metro-config');

// Automatically start the ESP32 Hardware Bridge alongside Expo!
try {
  require('./hardware_bridge.js');
} catch (err) {
  console.warn('[METRO] Hardware bridge auto-start warning:', err.message);
}

const config = getDefaultConfig(__dirname);

module.exports = config;

