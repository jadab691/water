import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import Text from "@/components/Text";
import { Link } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
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
            Signup
          </Text>
          <Text className="text-center text-base text-[#71717a] px-14">
            Create new account to continue using{" "}
            <Text className="font-bold">Smart Hydrate</Text>
          </Text>
        </View>

        <View className="flex flex-col gap-5 w-full">
          <FormInput label="Full Name" value="" styles="bg-white" />
          <FormInput label="Email Address" value="" styles="bg-white" />
          <FormInput
            value={formState.password}
            label="Set Password"
            action={(e: any) => setFormState({ ...formState, password: e })}
            isPassword={true}
            styles="bg-white"
          />
          <FormInput
            label="Confirm Password"
            value={formState.password}
            action={(e: any) => setFormState({ ...formState, password: e })}
            isPassword={true}
            styles="bg-white"
          />

          <Btn label="Sign Up" styles="bg-[#0090C8]" textStyles="text-white" />

          <Link
            href="/login"
            className="text-center text-base text-[#71717a] px-5"
          >
            Already have account?{" "}
            <Text className="font-bold text-[#0090C8]">Log In</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignupEmail;
