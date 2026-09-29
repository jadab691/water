import { useAppAuth } from "@/utils/auth";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAppAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-[#F4F4F5] justify-center items-center">
        <ActivityIndicator size="large" color="#0090C8" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href={"/home"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
