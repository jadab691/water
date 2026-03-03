import Text from "@/components/Text";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Badges() {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <SafeAreaView className="flex flex-col flex-1 justify-start bg-[#FAFAFA] p-6">
        <View className="mb-6">
          <Text className="text-[#27272A] text-2xl" font="fustat-bold">
            Badges
          </Text>
        </View>
        <View className="bg-white rounded-lg p-4">
          <Text className="text-gray-500">No badges yet</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
