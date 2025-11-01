// app.config.js
// Single-source Expo config generator. Loads env vars and injects platform-specific
// Google Maps API keys into native config and expo.extra so runtime JS can access them.
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.development') });
require('dotenv').config();

module.exports = ({ config }) => {
  // Read the env vars you said you use in your .env
  const androidKey = process.env.EXPO_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  const iosKey = process.env.EXPO_GOOGLE_MAPS_API_KEY_IOS || process.env.GOOGLE_MAPS_API_KEY_IOS || '';

  // Build plugins array conditionally: only add react-native-maps plugin
  // when the package provides an app.plugin.js (config plugin). This avoids
  // Expo trying to import react-native-maps at dev-time when the package
  // doesn't export a config plugin (which causes the "Unexpected token '<'"
  // error seen in Expo Go).
  const basePlugins = Array.isArray(config.expo?.plugins) ? [...config.expo.plugins] : [];
  try {
    // If react-native-maps provides an app.plugin.js, resolve it and include the plugin.
    // This will throw if the file doesn't exist, and we silently skip the plugin.
    require.resolve('react-native-maps/app.plugin.js');
    basePlugins.push(['react-native-maps', { provider: 'google' }]);
  } catch (e) {
    // No plugin available; skip adding it (safe for managed Expo workflows).
  }

  const out = {
    ...config,
    expo: {
      ...config.expo,
      android: {
        ...config.expo?.android,
        config: {
          ...(config.expo?.android?.config || {}),
          googleMaps: {
            apiKey: androidKey,
          },
        },
      },
      ios: {
        ...config.expo?.ios,
        config: {
          ...(config.expo?.ios?.config || {}),
          googleMapsApiKey: iosKey,
        },
        infoPlist: {
          ...(config.expo?.ios?.infoPlist || {}),
          NSLocationWhenInUseUsageDescription:
            config.expo?.ios?.infoPlist?.NSLocationWhenInUseUsageDescription ||
            'We need your location to show nearby distributors and set your address',
        },
      },
      extra: {
        ...(config.expo?.extra || {}),
        GOOGLE_MAPS_API_KEY_ANDROID: androidKey,
        GOOGLE_MAPS_API_KEY_IOS: iosKey,
        // Backwards compatibility key used in some screens
        GOOGLE_MAPS_API_KEY: iosKey || androidKey || (config.expo?.extra && config.expo.extra.GOOGLE_MAPS_API_KEY) || '',
        // Optional API base for proxying map requests to your backend (e.g. http://192.168.1.5:3002)
        EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || config.expo?.extra?.EXPO_PUBLIC_API_URL || '',
      },
      // Plugins array assembled above (may or may not contain react-native-maps)
      plugins: basePlugins,
    },
  };

  return out;
};
