import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ActivityIndicator, LogBox, View } from "react-native";
import Toast from "react-native-toast-message";
import useLastPage from "../hooks/useLastPage";
import AuthProvider from "./AuthProvider";
import { WorkoutContext } from "./WorkoutContext";

LogBox.ignoreLogs([
  'Failed to set an indexed property',
  'CSSStyleDeclaration',
  'Indexed property setter is not supported',
  'Uncaught TypeError: Failed to set an indexed property',
  'Unable to set cookie',
  'Event processing aborted during storage',
  'react-native-reanimated',
  'react-native-svg',
  'WebShape.js',
  'mapperRun',
  'styleUpdater',
  '@expo/vector-icons',
  'Ionicons',
  'expo-font',
  'fontDisplay',
  'font-face',
  'property [0] on',
  'property setter is not supported',
  'CSSStyleDeclaration: Indexed property',
  'Failed to set an indexed property [0] on \'CSSStyleDeclaration\'',
]);

export default function RootLayout() {
  useLastPage();
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  if (!publishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootLayoutContent />
    </ClerkProvider>
  );
}

function RootLayoutContent() {
  const { isLoaded } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <WorkoutContext>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <Toast />
      </WorkoutContext>
    </AuthProvider>
  );
}
