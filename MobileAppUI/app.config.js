// app.config.js
// Single-source Expo config generator. Loads env vars from APP_ENV-specific .env files.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').trim();
const envFile = `.env.${appEnv}`;
const envPath = path.resolve(__dirname, envFile);

const getEnvValue = (name, fallback = '') => process.env[name] || fallback;

if (fs.existsSync(envPath)) {
  console.log(`🎯 app.config: loading env ${envFile}`);
  dotenv.config({ path: envPath });
} else if (fs.existsSync(path.resolve(__dirname, '.env'))) {
  console.warn(`⚠️ app.config: ${envFile} not found, loading .env fallback.`);
  dotenv.config();
} else {
  console.warn(`⚠️ app.config: no env file found. Please create ${envFile} or .env`);
}

module.exports = ({ config }) => {
  // Read the env vars you said you use in your .env
  const androidKey = getEnvValue('EXPO_GOOGLE_MAPS_API_KEY', getEnvValue('GOOGLE_MAPS_API_KEY'));
  const iosKey = getEnvValue('EXPO_GOOGLE_MAPS_API_KEY_IOS', getEnvValue('GOOGLE_MAPS_API_KEY_IOS'));
  const publicApiUrl = getEnvValue('EXPO_PUBLIC_API_URL', config.expo?.extra?.EXPO_PUBLIC_API_URL || '');
  const publicIntegratedNo = getEnvValue('EXPO_PUBLIC_INTEGRATED_NO');
  const publicAdminToNumber = getEnvValue('EXPO_PUBLIC_ADMIN_TO_NUMBER');
  const publicMsg91AuthKey = getEnvValue('EXPO_PUBLIC_MSG91_AUTH_KEY');
  const publicMsg91WhatsappUrl = getEnvValue('EXPO_PUBLIC_MSG91_WHATSAPP_URL');

  // Build plugins array conditionally: only add react-native-maps plugin
  // when the package provides an app.plugin.js (config plugin). This avoids
  // Expo trying to import react-native-maps at dev-time when the package
  // doesn't export a config plugin (which causes the "Unexpected token '<'"
  // error seen in Expo Go).
  const basePlugins = Array.isArray(config.expo?.plugins) ? [...config.expo.plugins] : [];
  
  // Add DateTimePicker plugin
  basePlugins.push('@react-native-community/datetimepicker');
  
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
      projectId: "4723d436-4ca1-433e-91dc-708913375cfa",
      android: {
        ...config.expo?.android,
        package: "com.amitavpanda.mobileappui",
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
        eas: {
          projectId: "4723d436-4ca1-433e-91dc-708913375cfa",
        },
        GOOGLE_MAPS_API_KEY_ANDROID: androidKey,
        GOOGLE_MAPS_API_KEY_IOS: iosKey,
        // Backwards compatibility key used in some screens
        GOOGLE_MAPS_API_KEY: iosKey || androidKey || (config.expo?.extra && config.expo.extra.GOOGLE_MAPS_API_KEY) || '',
        // Optional API base for proxying map requests to your backend (e.g. http://192.168.1.5:3002)
        EXPO_PUBLIC_API_URL: publicApiUrl,
        EXPO_PUBLIC_INTEGRATED_NO: publicIntegratedNo,
        EXPO_PUBLIC_ADMIN_TO_NUMBER: publicAdminToNumber,
        EXPO_PUBLIC_MSG91_AUTH_KEY: publicMsg91AuthKey,
        EXPO_PUBLIC_MSG91_WHATSAPP_URL: publicMsg91WhatsappUrl,
      },
      // Plugins array assembled above (may or may not contain react-native-maps)
      plugins: basePlugins,
    },
  };

  return out;
};
