/**
 * Injects Google Maps API keys from env at prebuild / run:android time.
 *
 * Add to .env.development / .env.production (gitignored):
 *   GOOGLE_MAPS_ANDROID_API_KEY=your_key
 *
 * Use a non-EXPO_PUBLIC name so the key is never inlined into the JS bundle.
 * It is still embedded in the native Android build (required for Maps SDK).
 */
module.exports = function withGoogleMapsFromEnv(config) {
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  const iosKey =
    process.env.GOOGLE_MAPS_IOS_API_KEY ?? process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  if (!androidKey && !iosKey) {
    console.warn(
      '[withGoogleMapsFromEnv] GOOGLE_MAPS_ANDROID_API_KEY is not set — maps may not work.',
    );
    return config;
  }

  if (androidKey) {
    config.android = config.android ?? {};
    config.android.config = config.android.config ?? {};
    config.android.config.googleMaps = { apiKey: androidKey };
  }

  if (iosKey) {
    config.ios = config.ios ?? {};
    config.ios.config = config.ios.config ?? {};
    config.ios.config.googleMapsApiKey = iosKey;
  }

  return config;
};
