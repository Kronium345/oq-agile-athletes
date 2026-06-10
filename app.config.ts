import type { ConfigContext, ExpoConfig } from 'expo/config';

function googleIosUrlScheme(
  iosClientId: string | undefined,
): string | undefined {
  if (!iosClientId?.includes('.apps.googleusercontent.com')) {
    return undefined;
  }

  const clientPrefix = iosClientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${clientPrefix}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleScheme = googleIosUrlScheme(process.env.EXPO_PUBLIC_IOS_CLIENT_ID);

  const plugins: ExpoConfig['plugins'] = [
    ...(config.plugins ?? []),
    'expo-apple-authentication',
  ];

  if (googleScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleScheme },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'Agile Athletes',
    ios: {
      ...config.ios,
      usesAppleSignIn: true,
    },
    plugins,
  } as ExpoConfig;
};
