import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import { AppleIcon, EmailIcon, GoogleIcon } from "@/components/SVGIcons";
import Text from "@/components/Text";
import { useAuth, useSignIn } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VerificationMethod =
  | "email_code"
  | "phone_code"
  | "totp"
  | "backup_code"
  | null;

type FormState = {
  email: string;
  password: string;
  verificationCode: string;
};

const Login = () => {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const hasEmailSecondFactor = signIn.supportedSecondFactors.some(
    (factor) => factor.strategy === "email_code",
  );
  const hasPhoneSecondFactor = signIn.supportedSecondFactors.some(
    (factor) => factor.strategy === "phone_code",
  );

  const getPreferredVerificationMethod = (): VerificationMethod => {
    const strategies = signIn.supportedSecondFactors.map(
      (factor) => factor.strategy,
    );

    if (strategies.includes("email_code")) return "email_code";
    if (strategies.includes("phone_code")) return "phone_code";
    if (strategies.includes("totp")) return "totp";
    if (strategies.includes("backup_code")) return "backup_code";

    return null;
  };

  const getSafeIdentifier = (strategy: "email_code" | "phone_code") => {
    const factor = signIn.supportedSecondFactors.find(
      (item) => item.strategy === strategy,
    );

    if (!factor || !("safeIdentifier" in factor)) {
      return null;
    }

    return factor.safeIdentifier;
  };

  const [generalError, setGeneralError] = useState<string>("");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod>(null);
  const [formState, setFormState] = useState<FormState>({
    email: "",
    password: "",
    verificationCode: "",
  });

  const finalizeSession = async () => {
    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setGeneralError(
        finalizeError.longMessage || "Failed to create active session.",
      );
      return false;
    }

    router.replace("/home");
    return true;
  };

  const prepareSecondFactor = async () => {
    const secondFactorStrategies = signIn.supportedSecondFactors.map(
      (factor) => factor.strategy,
    );

    if (secondFactorStrategies.includes("email_code")) {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setGeneralError(
          error.longMessage || "Failed to send verification code.",
        );
        return false;
      }
      setVerificationMethod("email_code");
      const safeIdentifier = getSafeIdentifier("email_code");
      setInfoMessage(
        safeIdentifier
          ? `A verification code was sent to ${safeIdentifier}.`
          : "A verification code was sent to your email.",
      );
      return true;
    }

    if (secondFactorStrategies.includes("phone_code")) {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) {
        setGeneralError(
          error.longMessage || "Failed to send verification code.",
        );
        return false;
      }
      setVerificationMethod("phone_code");
      const safeIdentifier = getSafeIdentifier("phone_code");
      setInfoMessage(
        safeIdentifier
          ? `A verification code was sent to ${safeIdentifier}.`
          : "A verification code was sent to your phone.",
      );
      return true;
    }

    if (secondFactorStrategies.includes("totp")) {
      setVerificationMethod("totp");
      setInfoMessage("Enter the code from your authenticator app.");
      return true;
    }

    if (secondFactorStrategies.includes("backup_code")) {
      setVerificationMethod("backup_code");
      setInfoMessage("Enter one of your backup codes.");
      return true;
    }

    setGeneralError(
      "This account needs a verification method not supported in this screen.",
    );
    return false;
  };

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    if (!formState.email.trim() || !formState.password) {
      setGeneralError("Please enter email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signIn.password({
        emailAddress: formState.email.trim(),
        password: formState.password,
      });

      if (error) {
        setGeneralError(error.longMessage || "Login failed. Please try again.");
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSession();
        return;
      }

      if (signIn.status === "needs_second_factor") {
        await prepareSecondFactor();
        return;
      }

      if (signIn.status === "needs_client_trust") {
        setGeneralError(
          "This sign-in requires additional device trust verification.",
        );
        return;
      }

      setGeneralError(
        "Additional verification is required to complete sign-in.",
      );
    } catch (error: any) {
      const errorMessage =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        error?.message ||
        "Login failed. Please try again.";
      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySecondFactor = async () => {
    const method = verificationMethod || getPreferredVerificationMethod();
    if (!isLoaded || !signIn || !method) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    if (!formState.verificationCode.trim()) {
      setGeneralError("Please enter the verification code.");
      setIsLoading(false);
      return;
    }

    try {
      let response: {
        error: { longMessage?: string; message?: string } | null;
      };

      if (method === "email_code") {
        response = await signIn.mfa.verifyEmailCode({
          code: formState.verificationCode.trim(),
        });
      } else if (method === "phone_code") {
        response = await signIn.mfa.verifyPhoneCode({
          code: formState.verificationCode.trim(),
        });
      } else if (method === "totp") {
        response = await signIn.mfa.verifyTOTP({
          code: formState.verificationCode.trim(),
        });
      } else {
        response = await signIn.mfa.verifyBackupCode({
          code: formState.verificationCode.trim(),
        });
      }

      if (response.error) {
        setGeneralError(
          response.error.longMessage ||
            response.error.message ||
            "Invalid verification code.",
        );
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSession();
        return;
      }

      setGeneralError("Verification is not complete yet. Please try again.");
    } catch (error: any) {
      setGeneralError(
        error?.errors?.[0]?.longMessage ||
          error?.errors?.[0]?.message ||
          error?.message ||
          "Verification failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const method = verificationMethod || getPreferredVerificationMethod();
    if (!signIn || !method) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      if (method === "email_code") {
        const { error } = await signIn.mfa.sendEmailCode();
        if (error) {
          setGeneralError(
            error.longMessage || "Failed to resend verification code.",
          );
          return;
        }
        const safeIdentifier = getSafeIdentifier("email_code");
        setInfoMessage(
          safeIdentifier
            ? `A new verification code was sent to ${safeIdentifier}.`
            : "A new verification code was sent to your email.",
        );
      }

      if (method === "phone_code") {
        const { error } = await signIn.mfa.sendPhoneCode();
        if (error) {
          setGeneralError(
            error.longMessage || "Failed to resend verification code.",
          );
          return;
        }
        const safeIdentifier = getSafeIdentifier("phone_code");
        setInfoMessage(
          safeIdentifier
            ? `A new verification code was sent to ${safeIdentifier}.`
            : "A new verification code was sent to your phone.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSignInFlow = async () => {
    if (!signIn) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      const { error } = await signIn.reset();
      if (error) {
        setGeneralError(error.longMessage || "Failed to reset login flow.");
        return;
      }

      setVerificationMethod(null);
      setFormState({ ...formState, verificationCode: "" });
      setInfoMessage("Sign-in flow reset. Please log in again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchVerificationMethod = async (
    targetMethod: "email_code" | "phone_code",
  ) => {
    if (!signIn) return;

    setGeneralError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      if (targetMethod === "email_code") {
        const { error } = await signIn.mfa.sendEmailCode();
        if (error) {
          setGeneralError(
            error.longMessage || "Failed to send verification code.",
          );
          return;
        }

        setVerificationMethod("email_code");
        const safeIdentifier = getSafeIdentifier("email_code");
        setInfoMessage(
          safeIdentifier
            ? `A verification code was sent to ${safeIdentifier}.`
            : "A verification code was sent to your email.",
        );
        return;
      }

      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) {
        setGeneralError(
          error.longMessage || "Failed to send verification code.",
        );
        return;
      }

      setVerificationMethod("phone_code");
      const safeIdentifier = getSafeIdentifier("phone_code");
      setInfoMessage(
        safeIdentifier
          ? `A verification code was sent to ${safeIdentifier}.`
          : "A verification code was sent to your phone.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSignedIn) {
    return <Redirect href="/home" />;
  }

  const isSecondFactorStep = signIn.status === "needs_second_factor";
  const activeVerificationMethod =
    verificationMethod ||
    (isSecondFactorStep ? getPreferredVerificationMethod() : null);

  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-center bg-[#F4F4F5] p-6 gap-10">
      <View className="flex gap-12 items-center justify-center rounded-3xl  w-full">
        <View className="flex gap-2">
          <Text className="text-center text-3xl font-bold tracking-tight">
            {isSecondFactorStep ? "Verify Login" : "Login"}
          </Text>
          <Text className="text-center text-base text-[#71717a] px-14">
            {isSecondFactorStep
              ? "Complete additional verification to sign in"
              : "Login your account to continue using "}
            <Text className="font-bold">Smart Hydrate</Text>
          </Text>
        </View>

        <View className="flex flex-col gap-5 w-full">
          {isSecondFactorStep ? (
            <>
              <FormInput
                label="Verification Code"
                value={formState.verificationCode}
                action={(e: string) =>
                  setFormState({ ...formState, verificationCode: e })
                }
                styles="bg-white"
              />
              <Btn
                label={isLoading ? "Verifying..." : "Verify"}
                styles="bg-[#0090C8] w-full"
                textStyles="text-white"
                action={handleVerifySecondFactor}
              />
              {(activeVerificationMethod === "email_code" ||
                activeVerificationMethod === "phone_code") && (
                <Btn
                  label={isLoading ? "Sending..." : "Resend Code"}
                  styles="border border-[#E4E4E7] bg-white w-full"
                  action={handleResendCode}
                />
              )}
              {activeVerificationMethod === "email_code" &&
                hasPhoneSecondFactor && (
                  <Btn
                    label="Use Phone Code Instead"
                    styles="border border-[#E4E4E7] bg-white w-full"
                    action={() => handleSwitchVerificationMethod("phone_code")}
                  />
                )}
              {activeVerificationMethod === "phone_code" &&
                hasEmailSecondFactor && (
                  <Btn
                    label="Use Email Code Instead"
                    styles="border border-[#E4E4E7] bg-white w-full"
                    action={() => handleSwitchVerificationMethod("email_code")}
                  />
                )}
              {activeVerificationMethod === "email_code" && (
                <Text className="text-[#71717A] text-xs text-center -mt-1">
                  If you do not see it, check spam/junk and wait up to 2
                  minutes.
                </Text>
              )}
              {!activeVerificationMethod && (
                <Text className="text-[#71717A] text-xs text-center -mt-1">
                  No default method was selected. Reset and log in again.
                </Text>
              )}
              <Btn
                label="Start Over"
                styles="border border-[#E4E4E7] bg-white w-full"
                action={handleResetSignInFlow}
              />
            </>
          ) : (
            <>
              <FormInput
                label="Email Address"
                value={formState.email}
                action={(e: string) => setFormState({ ...formState, email: e })}
                styles="bg-white"
              />
              <FormInput
                value={formState.password}
                label="Password"
                action={(e: string) =>
                  setFormState({ ...formState, password: e })
                }
                isPassword={true}
                styles="bg-white"
              />
              <View className="flex flex-row justify-between -mt-1 mb-2">
                <View className="flex flex-row gap-2 text-center items-center">
                  <View className="w-5 h-5 border border-[#D4D4D8] rounded-md" />
                  <Text className="text-[#71717A]"> Remember me</Text>
                </View>
                <Link
                  href="/forgot-password"
                  className="text-base text-[#0090C8]"
                >
                  Forgot Password?
                </Link>
              </View>

              <Btn
                label={isLoading ? "Logging In..." : "Log In"}
                styles="bg-[#0090C8] w-full"
                textStyles="text-white"
                action={handleSignIn}
              />
            </>
          )}

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

          {!isSecondFactorStep && (
            <>
              <View className="flex flex-row items-center justify-center gap-4 px-4  overflow-hidden">
                <View className="border-b border-[#E4E4E7] w-full" />
                <Text className="text-center">or</Text>
                <View className="border-b border-[#E4E4E7] w-full" />
              </View>

              <View className="flex flex-col gap-2 w-full">
                <Btn
                  label="Continue with Google"
                  styles="border border-[#E4E4E7] w-full"
                  leftIcon={<GoogleIcon style={{ width: 18, height: 18 }} />}
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

              <Link
                href="/signup"
                className="text-center text-base text-[#71717a] px-5"
              >
                Don't have account?{" "}
                <Text className="font-bold text-[#0090C8]">Sign Up</Text>
              </Link>
            </>
          )}

          <View nativeID="clerk-captcha" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
