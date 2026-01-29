import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Signup = () => {
  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-center bg-[#F4F4F5] p-6">
      <View className="items-center justify-center bg-white p-10 rounded-3xl">
        <View className="flex gap-2">
          <Text className="text-center text-3xl font-bold tracking-tight">
            Signup
          </Text>
          <Text className="text-center text-base text-[#71717a] px-5">
            Create new account to continue using{" "}
            <Text className="font-bold">Smart Hydrate</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Signup;
