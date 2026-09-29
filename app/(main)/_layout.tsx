import BottomNavbar from "@/components/BottomNavbar";
import { apiClient } from "@/utils/api";
import { useAppAuth } from "@/utils/auth";
import { Redirect, Stack } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainLayout() {
  const { isSignedIn, isLoaded, user } = useAppAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isSignedIn && user?.id) {
      // Pre-fetch all tab data in parallel in the background on startup
      apiClient.prewarmUserData(user.id);
    }
  }, [isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-[#FAFAFA] justify-center items-center">
        <ActivityIndicator size="large" color="#0090C8" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href={"/login"} />;
  }

  return (
    <View className="flex-1 bg-[#FAFAFA]" style={{ paddingTop: insets.top }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 150,
          contentStyle: { backgroundColor: "#FAFAFA" },
        }}
      />
      <BottomNavbar />
    </View>
  );
}
