import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import { AppleIcon, EmailIcon, GoogleIcon } from "@/components/SVGIcons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormState = {
  sid: string | null;
  name: string;
  email: string | null;
  password: string;
  department: string;
  session: string | null;
  role: string;
};

const SignupEmail = () => {
  const [formState, setFormState] = useState<FormState>({
    sid: null,
    name: "",
    email: null,
    password: "",
    department: "",
    session: null,
    role: "",
  });

  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-center bg-[#F4F4F5] p-6 gap-10">
      <View className="flex gap-12 items-center justify-center rounded-3xl  w-full">
        <View className="flex gap-2">
          <Text className="text-center text-3xl font-bold tracking-tight">
            Login
          </Text>
          <Text className="text-center text-base text-[#71717a] px-14">
            Login your account to continue using{" "}
            <Text className="font-bold">Smart Hydrate</Text>
          </Text>
        </View>

        <View className="flex flex-col gap-5 w-full">
          <FormInput label="Email Address" value="" styles="bg-white" />
          <FormInput
            value={formState.password}
            label="Password"
            action={(e: any) => setFormState({ ...formState, password: e })}
            isPassword={true}
            styles="bg-white"
          />
          <View className="flex flex-row justify-between -mt-1 mb-2">
            <View className="flex flex-row gap-2 text-center items-center">
              <View className="w-5 h-5 border border-[#D4D4D8] rounded-md" />
              <Text className="text-[#71717A]"> Remember me</Text>
            </View>
            <Text className="text-base text-[#0090C8]">Forgot Password?</Text>
          </View>

          <Btn
            label="Log In"
            styles="bg-[#0090C8] w-full"
            textStyles="text-white"
          />

          <View className="flex flex-row items-center justify-center gap-4 px-4  overflow-hidden">
            <View className="border-b border-[#E4E4E7] w-full" />
            <Text className="text-center">or</Text>
            <View className="border-b border-[#E4E4E7] w-full" />
          </View>

          <View className="flex flex-col gap-2 w-full">
            <Btn
              label="Continue with Google"
              styles="border border-[#E4E4E7] w-full"
              leftIcon={<GoogleIcon />}
            />
            <Btn
              label="Continue with Apple"
              styles="border border-[#E4E4E7] w-full"
              leftIcon={<AppleIcon />}
            />
            <Btn
              label="Continue with Email"
              styles="border border-[#E4E4E7] w-full"
              leftIcon={<EmailIcon />}
              action={() => router.push("/signup-email")}
            />
          </View>

          <Text className="text-center text-base text-[#71717a] px-5">
            Don't have account?{" "}
            <Text className="font-bold text-[#0090C8]">Sign Up</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignupEmail;
