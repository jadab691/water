import { Bungee_400Regular, useFonts } from "@expo-google-fonts/bungee";
import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import {
  Fustat_300Light,
  Fustat_400Regular,
  Fustat_500Medium,
  Fustat_600SemiBold,
  Fustat_700Bold,
  Fustat_800ExtraBold,
} from "@expo-google-fonts/fustat";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Bungee_400Regular,
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
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    ></Stack>
  );
}
