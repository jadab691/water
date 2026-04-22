import BottomNavbar from "@/components/BottomNavbar";
import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const { isSignedIn, isLoaded } = useAuth({
    treatPendingAsSignedOut: false,
  });

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
    <View className="flex-1 bg-[#FAFAFA]">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <BottomNavbar />
    </View>
  );
}
