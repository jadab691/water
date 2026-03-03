import BottomNavbar from "@/components/BottomNavbar";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function RootLayout() {
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
