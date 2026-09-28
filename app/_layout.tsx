import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import { useAuth } from "@clerk/expo";
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
import { ActivityIndicator, View } from "react-native";
import { CLERK_PUBLISHABLE_KEY } from "@/utils/constants";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const publishableKey = CLERK_PUBLISHABLE_KEY;

function RootLayoutContent() {
  const [loaded, error] = useFonts({
    FredokaOne_400Regular,
    Fustat_400Regular,
    Fustat_300Light,
    Fustat_500Medium,
    Fustat_600SemiBold,
    Fustat_700Bold,
    Fustat_800ExtraBold,
  });

  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    SplashScreen.preventAutoHideAsync();
    return null;
  }

  // Show loading while auth is initializing
  if (!isLoaded) {
    return (
      <View className="flex-1 bg-[#F4F4F5] justify-center items-center">
        <ActivityIndicator size="large" color="#0090C8" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootLayoutContent />
    </ClerkProvider>
  );
}
