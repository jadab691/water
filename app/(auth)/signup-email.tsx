import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import Text from "@/components/Text";
import { useAuth, useSignUp } from "@clerk/expo";
import { Href, Link, Redirect, useRouter } from "expo-router";
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

type ClerkLikeError = {
  longMessage?: string;
  message?: string;
  code?: string;
  errors?: Array<{
    longMessage?: string;
    message?: string;
    code?: string;
  }>;
};

const SignupEmail = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [generalError, setGeneralError] = useState<string>("");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: "",
  });

  const getClerkErrorMessage = (error: unknown, fallback: string) => {
    if (!error) {
      return fallback;
    }

    if (typeof error === "string") {
      return error;
    }

    if (typeof error !== "object") {
      return fallback;
    }

    const parsedError = error as ClerkLikeError;

    if (parsedError.longMessage || parsedError.message) {
      return parsedError.longMessage || parsedError.message || fallback;
    }

    if (parsedError.errors?.length) {
      const detailedErrors = parsedError.errors
        .map((item) => item.longMessage || item.message || item.code)
        .filter(Boolean)
        .join("\n");

      if (detailedErrors) {
        return detailedErrors;
      }
    }

    return fallback;
  };

  const isVerifyingEmail =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const handleSignup = async () => {
    setGeneralError("");
    setInfoMessage("");

    if (!formState.name.trim()) {
      setGeneralError("Please enter your full name.");
      return;
    }

    if (!formState.email.trim() || !formState.password) {
      setGeneralError("Please provide email and password.");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setGeneralError("Passwords do not match.");
      return;
    }

    try {
      const { error } = await signUp.password({
        emailAddress: formState.email.trim(),
        password: formState.password,
      });

      if (error) {
        setGeneralError(getClerkErrorMessage(error, "Unable to sign up."));
        return;
      }

      await signUp.verifications.sendEmailCode();
      setInfoMessage("Verification code sent. Please check your email.");
    } catch (error) {
      setGeneralError(getClerkErrorMessage(error, "Unable to sign up."));
    }
  };

  const handleVerify = async () => {
    setGeneralError("");
    setInfoMessage("");

    if (!formState.code.trim()) {
      setGeneralError("Please enter the verification code.");
      return;
    }

    try {
      await signUp.verifications.verifyEmailCode({
        code: formState.code.trim(),
      });

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              return;
            }

            const url = decorateUrl("/");
            if (url.startsWith("http") && typeof window !== "undefined") {
              window.location.href = url;
            } else {
              router.push(url as Href);
            }
          },
        });
        return;
      }

      setGeneralError(`Verification is not complete (${signUp.status}).`);
    } catch (error) {
      setGeneralError(getClerkErrorMessage(error, "Verification failed."));
    }
  };

  const handleResendCode = async () => {
    setGeneralError("");
    setInfoMessage("");

    try {
      await signUp.verifications.sendEmailCode();
      setInfoMessage("A new verification code was sent to your email.");
    } catch (error) {
      setGeneralError(
        getClerkErrorMessage(error, "Failed to resend verification code."),
      );
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-center bg-[#F4F4F5] p-6 gap-10">
      <View className="flex gap-12 items-center justify-center rounded-3xl  w-full">
        <View className="flex gap-2">
          <Text className="text-center text-3xl font-bold tracking-tight">
            {isVerifyingEmail ? "Verify account" : "Signup"}
          </Text>
          <Text className="text-center text-base text-[#71717a] px-14">
            {isVerifyingEmail
              ? "Enter the code sent to your email"
              : "Create new account to continue using "}
            <Text className="font-bold">Smart Hydrate</Text>
          </Text>
        </View>

        <View className="flex flex-col gap-5 w-full">
          {isVerifyingEmail ? (
            <>
              <FormInput
                label="Verification Code"
                value={formState.code}
                action={(e: string) => setFormState({ ...formState, code: e })}
                styles="bg-white"
              />

              <Btn
                label={fetchStatus === "fetching" ? "Verifying..." : "Verify"}
                styles="bg-[#0090C8]"
                textStyles="text-white"
                action={handleVerify}
              />
              <Btn
                label="I need a new code"
                styles="border border-[#E4E4E7] bg-white"
                action={handleResendCode}
              />
            </>
          ) : (
            <>
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
                action={(e: string) =>
                  setFormState({ ...formState, password: e })
                }
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

              <Btn
                label={fetchStatus === "fetching" ? "Signing Up..." : "Sign Up"}
                styles="bg-[#0090C8]"
                textStyles="text-white"
                action={handleSignup}
              />
            </>
          )}

          {infoMessage && (
            <Text className="text-[#0C4A6E] text-sm text-center -mt-2">
              {infoMessage}
            </Text>
          )}

          {(generalError || errors.global?.length) && (
            <Text className="text-[#DC2626] text-sm text-center -mt-2">
              {generalError ||
                errors.global?.[0]?.longMessage ||
                errors.global?.[0]?.message}
            </Text>
          )}

          {errors.fields.emailAddress && (
            <Text className="text-[#DC2626] text-sm text-center -mt-2">
              {errors.fields.emailAddress.message}
            </Text>
          )}

          {errors.fields.password && (
            <Text className="text-[#DC2626] text-sm text-center -mt-2">
              {errors.fields.password.message}
            </Text>
          )}

          {errors.fields.code && (
            <Text className="text-[#DC2626] text-sm text-center -mt-2">
              {errors.fields.code.message}
            </Text>
          )}

          <Link
            href="/login"
            className="text-center text-base text-[#71717a] px-5"
          >
            Already have account?{" "}
            <Text className="font-bold text-[#0090C8]">Log In</Text>
          </Link>

          <View nativeID="clerk-captcha" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignupEmail;
