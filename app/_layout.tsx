import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import useLastPage from "../hooks/useLastPage";

export default function RootLayout() {
  useLastPage();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
