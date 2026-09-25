import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import Text from "@/components/Text";
import { apiClient } from "@/utils/api";
import { useAuth, useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  code: string;
};

const Signup = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp } = useSignUp();

  const [generalError, setGeneralError] = useState<string>("");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: "",
  });

  const handleSignup = async () => {
    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    if (!formState.name.trim()) {
      setGeneralError("Please enter your full name.");
      setIsLoading(false);
      return;
    }

    if (!formState.email.trim()) {
      setGeneralError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    if (!formState.password) {
      setGeneralError("Please enter your password.");
      setIsLoading(false);
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setGeneralError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formState.password.length < 8) {
      setGeneralError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const trimmedName = formState.name.trim();
      const nameParts = trimmedName.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

      const passwordResult = await signUp.password({
        emailAddress: formState.email.trim(),
        password: formState.password,
        firstName,
        ...(lastName ? { lastName } : {}),
      });

      if (passwordResult.error) {
        setGeneralError(passwordResult.error.message || "Signup failed.");
        setIsLoading(false);
        return;
      }

      const sendCodeResult = await signUp.verifications.sendEmailCode();
      if (sendCodeResult.error) {
        setGeneralError(
          sendCodeResult.error.message || "Failed to send verification code.",
        );
        setIsLoading(false);
        return;
      }

      setIsVerifyingEmail(true);
      setInfoMessage("Verification code sent to your email.");
      setIsLoading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setGeneralError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    if (!formState.code.trim()) {
      setGeneralError("Please enter the verification code.");
      setIsLoading(false);
      return;
    }

    try {
      const verifyResult = await signUp.verifications.verifyEmailCode({
        code: formState.code.trim(),
      });
      if (verifyResult.error) {
        setGeneralError(
          verifyResult.error.message || "Invalid verification code.",
        );
        setIsLoading(false);
        return;
      }

      const clerkUserId = signUp.createdUserId;

      if (!clerkUserId) {
        setGeneralError("Verification incomplete. Please check your code.");
        setIsLoading(false);
        return;
      }

      const trimmedName = formState.name.trim();
      const nameParts = trimmedName.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // Initialize profile on backend first before activating session
      try {
        await apiClient.makeRequest(
          "/api/users/initialize-profile",
          {
            method: "POST",
            body: JSON.stringify({
              clerkUserId,
              email: formState.email.trim(),
              firstName,
              lastName,
            }),
          },
        );
      } catch (backendErr) {
        console.warn("Backend profile init warning during signup:", backendErr);
      }

      const finalizeResult = await signUp.finalize();
      if (finalizeResult.error) {
        setGeneralError(
          finalizeResult.error.message || "Failed to finalize signup.",
        );
        setIsLoading(false);
        return;
      }

      router.replace("/home");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setGeneralError(errorMessage);
      setIsLoading(false);
    }
  };

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
          <FormInput
            label="Full Name"
            value={formState.name}
            action={(e: string) => setFormState({ ...formState, name: e })}
            styles="bg-white"
          />
          <FormInput
            label="Email Address"
            value={formState.email}
            action={(e: string) => setFormState({ ...formState, email: e })}
            styles="bg-white"
          />
          <FormInput
            value={formState.password}
            label="Set Password"
            action={(e: string) => setFormState({ ...formState, password: e })}
            isPassword={true}
            styles="bg-white"
          />
          <FormInput
            label="Confirm Password"
            value={formState.confirmPassword}
            action={(e: string) =>
              setFormState({ ...formState, confirmPassword: e })
            }
            isPassword={true}
            styles="bg-white"
          />

          {isVerifyingEmail && (
            <FormInput
              label="Email Verification Code"
              value={formState.code}
              action={(e: string) => setFormState({ ...formState, code: e })}
              styles="bg-white"
            />
          )}

          <Btn
            label={
              isLoading
                ? "Please wait..."
                : isVerifyingEmail
                  ? "Verify Email"
                  : "Sign Up"
            }
            styles="bg-[#0090C8]"
            textStyles="text-white"
            action={isVerifyingEmail ? handleVerifyEmail : handleSignup}
            disabled={isLoading}
          />

          {infoMessage && (
            <Text className="text-[#0C4A6E] text-sm text-center -mt-2">
              {infoMessage}
            </Text>
          )}

          {generalError && (
            <Text className="text-[#DC2626] text-sm text-center -mt-2">
              {generalError}
            </Text>
          )}

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

export default Signup;
