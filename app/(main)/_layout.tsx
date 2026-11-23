import BottomNavbar from "@/components/BottomNavbar";
import { useAppAuth } from "@/utils/auth";
import { initializeLocalUser } from "@/utils/localDatabase";
import { Redirect, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text as NativeText,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainLayout() {
  const { isSignedIn, isLoaded, user } = useAppAuth();
  const insets = useSafeAreaInsets();
  const [databaseState, setDatabaseState] = useState<{
    userId: string;
    status: "ready" | "error";
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      return;
    }

    let active = true;

    initializeLocalUser(user.id)
      .then(() => {
        if (active) setDatabaseState({ userId: user.id, status: "ready" });
      })
      .catch((error: unknown) => {
        console.error("Could not initialize local user data:", error);
        if (active) setDatabaseState({ userId: user.id, status: "error" });
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, retryCount]);

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

  const localDataState =
    databaseState?.userId === user?.id
      ? databaseState?.status
      : undefined;

  if (localDataState === "error") {
    return (
      <View className="flex-1 bg-[#FAFAFA] justify-center items-center px-8">
        <NativeText className="text-center text-[#27272A] mb-4">
          Your local data could not be opened. Please retry.
        </NativeText>
        <TouchableOpacity
          onPress={() => setRetryCount((count) => count + 1)}
          className="bg-[#0090C8] rounded-xl px-6 py-3"
        >
          <NativeText className="text-white">Retry</NativeText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user?.id || localDataState !== "ready") {
    return (
      <View className="flex-1 bg-[#FAFAFA] justify-center items-center">
        <ActivityIndicator size="large" color="#0090C8" />
      </View>
    );
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
