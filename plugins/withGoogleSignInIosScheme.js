/**
 * Registers the Google Sign-In iOS URL scheme from EXPO_PUBLIC_IOS_CLIENT_ID at prebuild.
 * Writes directly to Info.plist — adding the google-signin plugin dynamically to the
 * plugins array does not reliably run on EAS prebuild.
 */
const {
  createRunOncePlugin,
  IOSConfig,
  withInfoPlist,
} = require('@expo/config-plugins');

function withGoogleSignInIosScheme(config) {
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
  if (!iosClientId?.includes('.apps.googleusercontent.com')) {
    console.warn(
      '[withGoogleSignInIosScheme] EXPO_PUBLIC_IOS_CLIENT_ID is missing — Google Sign-In iOS URL scheme will not be added.',
    );
    return config;
  }

  const clientPrefix = iosClientId.replace('.apps.googleusercontent.com', '');
  const iosUrlScheme = `com.googleusercontent.apps.${clientPrefix}`;

  return withInfoPlist(config, (cfg) => {
    if (!IOSConfig.Scheme.hasScheme(iosUrlScheme, cfg.modResults)) {
      cfg.modResults = IOSConfig.Scheme.appendScheme(iosUrlScheme, cfg.modResults);
    }
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withGoogleSignInIosScheme,
  'with-google-sign-in-ios-scheme',
);
