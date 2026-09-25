import Btn from "@/components/Btn";
import FormInput from "@/components/FormInput";
import Text from "@/components/Text";
import { useAuth, useSessionList, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const Login = () => {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const {
    isLoaded: isSessionListLoaded,
    sessions,
    setActive,
  } = useSessionList();
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

  const isAlreadySignedInError = (error: unknown) => {
    if (!error || typeof error !== "object") {
      return false;
    }

    const parsedError = error as ClerkLikeError;
    const topLevelCode = parsedError.code?.toLowerCase() || "";
    const nestedCodes =
      parsedError.errors
        ?.map((item) => (item.code || "").toLowerCase())
        .filter(Boolean) || [];

    const allCodes = [topLevelCode, ...nestedCodes];

    return allCodes.some(
      (code) =>
        code === "session_exists" ||
        code === "already_signed_in" ||
        code.includes("session_exists") ||
        code.includes("already_signed"),
    );
  };

  const recoverExistingSession = async () => {
    if (!isSessionListLoaded || !setActive || !sessions?.length) {
      return false;
    }

    try {
      const targetSession = sessions[0];
      if (!targetSession) {
        return false;
      }

      await setActive({ session: targetSession.id });
      router.replace("/home");
      return true;
    } catch (error) {
      setGeneralError(
        getClerkErrorMessage(
          error,
          "Found a session, but failed to activate it. Please login again.",
        ),
      );
      return false;
    }
  };

  const isFinalizingRef = useRef(false);

  const finalizeSession = async () => {
    if (isFinalizingRef.current) return false;
    isFinalizingRef.current = true;

    if (signIn.status !== "complete" || !signIn.createdSessionId) {
      const recovered = await recoverExistingSession();
      if (!recovered) {
        isFinalizingRef.current = false;
      }
      return recovered;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      isFinalizingRef.current = false;
      setGeneralError(
        getClerkErrorMessage(finalizeError, "Failed to create active session."),
      );
      return false;
    }

    router.replace("/home");
    return true;
  };

  useEffect(() => {
    const recoverSessionIfPossible = async () => {
      if (!isLoaded || !signIn || isSignedIn || isFinalizingRef.current) {
        return;
      }

      if (isSessionListLoaded && sessions?.length && !isLoading) {
        await recoverExistingSession();
      }
    };

    recoverSessionIfPossible();
  }, [
    isLoaded,
    isSignedIn,
    isSessionListLoaded,
    sessions?.length,
  ]);

  const prepareSecondFactor = async () => {
    const secondFactorStrategies = signIn.supportedSecondFactors.map(
      (factor) => factor.strategy,
    );

    if (secondFactorStrategies.includes("email_code")) {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setGeneralError(
          getClerkErrorMessage(error, "Failed to send verification code."),
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
          getClerkErrorMessage(error, "Failed to send verification code."),
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
      // Always start from a clean SignIn state so stale attempts do not trap the flow.
      await signIn.reset();

      const { error } = await signIn.password({
        emailAddress: formState.email.trim(),
        password: formState.password,
      });

      if (error) {
        if (isAlreadySignedInError(error)) {
          const recovered = await recoverExistingSession();
          if (recovered) {
            return;
          }

          setGeneralError(
            "Clerk reports an existing session, but it could not be activated locally. Please tap Start Over and log in again.",
          );
          return;
        }

        setGeneralError(getClerkErrorMessage(error, "Login failed."));
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
        `Sign-in requires additional verification (${signIn.status}).`,
      );
    } catch (error: any) {
      if (isAlreadySignedInError(error)) {
        const recovered = await recoverExistingSession();
        if (recovered) {
          return;
        }

        setGeneralError(
          "Clerk reports an existing session, but it could not be activated locally. Please tap Start Over and log in again.",
        );
        return;
      }

      setGeneralError(getClerkErrorMessage(error, "Login failed."));
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
          getClerkErrorMessage(response.error, "Invalid verification code."),
        );
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSession();
        return;
      }

      setGeneralError("Verification is not complete yet. Please try again.");
    } catch (error: any) {
      setGeneralError(getClerkErrorMessage(error, "Verification failed."));
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
            getClerkErrorMessage(error, "Failed to resend verification code."),
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
            getClerkErrorMessage(error, "Failed to resend verification code."),
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
        setGeneralError(
          getClerkErrorMessage(error, "Failed to reset login flow."),
        );
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
            getClerkErrorMessage(error, "Failed to send verification code."),
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
          getClerkErrorMessage(error, "Failed to send verification code."),
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
              <View className="flex flex-row justify-end -mt-1 mb-2">
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
            <Link
              href="/signup"
              className="text-center text-base text-[#71717a] px-5"
            >
              Don't have account?{" "}
              <Text className="font-bold text-[#0090C8]">Sign Up</Text>
            </Link>
          )}

          <View nativeID="clerk-captcha" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
