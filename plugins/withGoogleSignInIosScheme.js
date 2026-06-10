/**
 * Sets Google Sign-In iOS URL scheme from EXPO_PUBLIC_IOS_CLIENT_ID at prebuild time.
 * Keeps iosUrlScheme out of app.json so the client ID stays in env / EAS secrets.
 */
module.exports = function withGoogleSignInIosScheme(config) {
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
  if (!iosClientId?.includes('.apps.googleusercontent.com')) {
    return config;
  }

  const clientPrefix = iosClientId.replace('.apps.googleusercontent.com', '');
  const iosUrlScheme = `com.googleusercontent.apps.${clientPrefix}`;
  const pluginName = '@react-native-google-signin/google-signin';

  const plugins = (config.plugins ?? []).filter((entry) => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    return name !== pluginName;
  });

  plugins.push([pluginName, { iosUrlScheme }]);

  return { ...config, plugins };
};
