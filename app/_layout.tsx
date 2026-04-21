import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import {
  Fustat_300Light,
  Fustat_400Regular,
  Fustat_500Medium,
  Fustat_600SemiBold,
  Fustat_700Bold,
  Fustat_800ExtraBold,
} from "@expo-google-fonts/fustat";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    FredokaOne_400Regular,
    Fustat_400Regular,
    Fustat_300Light,
    Fustat_500Medium,
    Fustat_600SemiBold,
    Fustat_700Bold,
    Fustat_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    SplashScreen.preventAutoHideAsync();
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      ></Stack>
    </ClerkProvider>
  );
}
