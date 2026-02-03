import Btn from "@/components/Btn";
import {
  AppleIcon,
  EmailIcon,
  GoogleIcon,
  QuaDizIcon,
} from "@/components/SVGIcons";
import Text from "@/components/Text";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Signup = () => {
  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-center bg-[#F4F4F5] p-6 gap-10">
      <View className="flex gap-12 items-center justify-center  p-10 rounded-3xl bg-white w-full">
        <View className="flex gap-2">
          <Text className="text-center text-3xl font-bold tracking-tight">
            Signup
          </Text>
          <Text className="text-center text-base text-[#71717a] px-5">
            Create new account to continue using{" "}
            <Text className="font-bold">Smart Hydrate</Text>
          </Text>
        </View>

        <View className="flex flex-col gap-2 w-full">
          <Btn
            label="Continue with Google"
            styles="border border-[#E4E4E7] w-full"
            leftIcon={<GoogleIcon style={{ width: 18, height: 18 }} />}
            action={() => router.push("/home")}
          />
          <Btn
            label="Continue with Apple"
            styles="border border-[#E4E4E7] w-full"
            leftIcon={<AppleIcon style={{ width: 18, height: 18 }} />}
          />
          <Btn
            label="Continue with Email"
            styles="border border-[#E4E4E7] w-full"
            leftIcon={<EmailIcon style={{ width: 18, height: 18 }} />}
            action={() => router.push("/signup-email")}
          />
        </View>
      </View>
      <View className="flex flex-row items-center justify-center gap-2 mb-2">
        <Text className="text-center text-base text-[#71717A] justify-center text-Color-Solid-Color-Default-default-500 font-medium font-['Fustat'] tracking-tight">
          Powered by:
        </Text>
        <QuaDizIcon />
      </View>
    </SafeAreaView>
  );
};

export default Signup;
