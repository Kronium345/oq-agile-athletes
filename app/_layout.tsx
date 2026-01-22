import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import useLastPage from "../hooks/useLastPage";
import AuthProvider from "./AuthProvider";

export default function RootLayout() {
  useLastPage();

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
