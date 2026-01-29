import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import { Link } from "expo-router";
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

  const [step, setStep] = useState(1);

  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-center bg-[#F4F4F5] p-6 gap-10">
      <View className="flex gap-12 items-center justify-center rounded-3xl  w-full">
        <View className="flex gap-2">
          <Text className="text-center text-3xl font-bold tracking-tight">
            {step === 1
              ? "Forget password?"
              : step === 2
                ? "Set New Password"
                : null}
          </Text>
          <Text className="text-center text-base text-[#71717a] px-10">
            {step === 1
              ? "Enter your email below and we will send you a reset link"
              : step === 2
                ? "Type your new password"
                : null}
          </Text>
        </View>

        {step === 1 ? (
          <View className="flex flex-col w-full">
            <FormInput label="Email Address" value="" styles="bg-white" />

            <Btn
              label="Send Verification Code"
              styles="bg-[#0090C8] mt-7 mb-6"
              textStyles="text-white"
              action={() => setStep(2)}
            />

            <Link
              href="/login"
              className="text-center text-base text-[#0090C8]  px-5"
            >
              Still having problem?
            </Link>
          </View>
        ) : step === 2 ? (
          <View className="flex flex-col w-full gap-4">
            <FormInput
              label="Type new password"
              isPassword={true}
              value=""
              styles="bg-white"
            />
            <FormInput
              label="Confirm password"
              isPassword={true}
              value=""
              styles="bg-white"
            />

            <Btn
              label="Set Password"
              styles="bg-[#0090C8] mt-3"
              textStyles="text-white"
              action={() => setStep(1)}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default SignupEmail;
