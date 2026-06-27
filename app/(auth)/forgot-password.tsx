import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import Text from "@/components/Text";
import { useAuth, useSignIn } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormState = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
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

const ForgotPassword = () => {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });

  const [step, setStep] = useState(1);
  const [generalError, setGeneralError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSendVerificationCode = async () => {
    if (!isLoaded || !signIn) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    if (!formState.email.trim()) {
      setGeneralError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: createError } = await signIn.create({
        strategy: "reset_password_email_code" as any,
        identifier: formState.email.trim(),
      });

      if (createError) {
        setGeneralError(
          getClerkErrorMessage(createError, "Unable to start password reset."),
        );
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setGeneralError(
          getClerkErrorMessage(
            sendError,
            "Failed to send password reset verification code.",
          ),
        );
        return;
      }

      setStep(2);
      setInfoMessage("Verification code sent. Please check your email.");
    } catch (error) {
      setGeneralError(
        getClerkErrorMessage(error, "Unable to start password reset."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!isLoaded || !signIn) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    if (!formState.code.trim()) {
      setGeneralError("Please enter the verification code.");
      setIsLoading(false);
      return;
    }

    if (!formState.password || !formState.confirmPassword) {
      setGeneralError("Please enter and confirm your new password.");
      setIsLoading(false);
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setGeneralError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: verifyError } =
        await signIn.resetPasswordEmailCode.verifyCode({
          code: formState.code.trim(),
        });

      if (verifyError) {
        setGeneralError(
          getClerkErrorMessage(verifyError, "Invalid verification code."),
        );
        return;
      }

      const { error: submitError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: formState.password,
        });

      if (submitError) {
        setGeneralError(
          getClerkErrorMessage(submitError, "Failed to update password."),
        );
        return;
      }

      if (signIn.status !== "complete") {
        setGeneralError(
          `Password reset is not complete yet (${signIn.status}).`,
        );
        return;
      }

      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        setGeneralError(
          getClerkErrorMessage(
            finalizeError,
            "Failed to create active session.",
          ),
        );
        return;
      }

      router.replace("/home");
    } catch (error) {
      setGeneralError(getClerkErrorMessage(error, "Failed to reset password."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSignedIn) {
    return <Redirect href="/home" />;
  }

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
            <FormInput
              label="Email Address"
              value={formState.email}
              action={(e: string) => setFormState({ ...formState, email: e })}
              styles="bg-white"
            />

            <Btn
              label={isLoading ? "Sending..." : "Send Verification Code"}
              styles="bg-[#0090C8] mt-7 mb-6"
              textStyles="text-white"
              action={handleSendVerificationCode}
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
              label="Verification Code"
              value={formState.code}
              action={(e: string) => setFormState({ ...formState, code: e })}
              styles="bg-white"
            />
            <FormInput
              label="Type new password"
              isPassword={true}
              value={formState.password}
              action={(e: string) =>
                setFormState({ ...formState, password: e })
              }
              styles="bg-white"
            />
            <FormInput
              label="Confirm password"
              isPassword={true}
              value={formState.confirmPassword}
              action={(e: string) =>
                setFormState({ ...formState, confirmPassword: e })
              }
              styles="bg-white"
            />

            <Btn
              label={isLoading ? "Updating..." : "Set Password"}
              styles="bg-[#0090C8] mt-3"
              textStyles="text-white"
              action={handleSetPassword}
            />

            <Btn
              label={isLoading ? "Sending..." : "Resend Code"}
              styles="border border-[#E4E4E7] bg-white"
              action={handleSendVerificationCode}
            />

            <Btn
              label="Start Over"
              styles="border border-[#E4E4E7] bg-white"
              action={() => {
                setStep(1);
                setGeneralError("");
                setInfoMessage("");
                setFormState({
                  ...formState,
                  code: "",
                  password: "",
                  confirmPassword: "",
                });
              }}
            />
          </View>
        ) : null}

        {infoMessage && (
          <Text className="text-[#0C4A6E] text-sm text-center -mt-3">
            {infoMessage}
          </Text>
        )}

        {generalError && (
          <Text className="text-[#DC2626] text-sm text-center -mt-3">
            {generalError}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ForgotPassword;
