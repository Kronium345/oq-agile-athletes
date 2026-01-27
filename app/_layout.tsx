import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
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
