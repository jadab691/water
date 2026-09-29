import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "./api";

const REVIEWER_KEY = "is_google_reviewer_mode";

/**
 * Hardcoded credentials dedicated for Google Play Store review.
 * Allows reviewers to enter directly with username/password without OTP or 2FA.
 */
export const REVIEWER_CREDENTIALS = {
  username: "reviewer@quadiz.com",
  alternativeUsername: "reviewer",
  password: "SmartHydrate2026!",
  userId: "user_google_reviewer",
  firstName: "Google",
  lastName: "Reviewer",
  fullName: "Google Reviewer",
  email: "reviewer@quadiz.com",
} as const;

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  primaryEmailAddress?: { emailAddress: string };
  hasImage?: boolean;
  imageUrl?: string;
  update?: (data: any) => Promise<any>;
};

type AuthContextType = {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: AppUser | null;
  isReviewer: boolean;
  loginAsReviewer: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  isReviewer: false,
  loginAsReviewer: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerkAuth = useClerkAuth({ treatPendingAsSignedOut: false });
  const clerkUser = useClerkUser();
  const [isReviewer, setIsReviewer] = useState(false);
  const [isCheckingReviewer, setIsCheckingReviewer] = useState(true);

  useEffect(() => {
    const checkReviewer = async () => {
      try {
        const val = await SecureStore.getItemAsync(REVIEWER_KEY);
        setIsReviewer(val === "true");
      } catch {
        setIsReviewer(false);
      } finally {
        setIsCheckingReviewer(false);
      }
    };
    checkReviewer();
  }, []);

  const loginAsReviewer = async () => {
    await SecureStore.setItemAsync(REVIEWER_KEY, "true");
    setIsReviewer(true);

    // Initialize backend profile and default cups in MySQL for the reviewer
    try {
      await apiClient.makeRequest("/api/users/initialize-profile", {
        method: "POST",
        body: JSON.stringify({
          clerkUserId: REVIEWER_CREDENTIALS.userId,
          email: REVIEWER_CREDENTIALS.email,
          firstName: REVIEWER_CREDENTIALS.firstName,
          lastName: REVIEWER_CREDENTIALS.lastName,
        }),
      });
    } catch (e) {
      console.warn("Could not pre-init reviewer profile:", e);
    }
  };

  const signOut = async () => {
    if (isReviewer) {
      await SecureStore.deleteItemAsync(REVIEWER_KEY);
      setIsReviewer(false);
    }
    apiClient.clearCache();
    if (clerkAuth.isSignedIn) {
      await clerkAuth.signOut();
    }
  };

  const isLoaded = isReviewer ? true : clerkAuth.isLoaded && !isCheckingReviewer;
  const isSignedIn = isReviewer || Boolean(clerkAuth.isSignedIn);

  let user: AppUser | null = null;
  if (isReviewer) {
    user = {
      id: REVIEWER_CREDENTIALS.userId,
      firstName: REVIEWER_CREDENTIALS.firstName,
      lastName: REVIEWER_CREDENTIALS.lastName,
      fullName: REVIEWER_CREDENTIALS.fullName,
      primaryEmailAddress: { emailAddress: REVIEWER_CREDENTIALS.email },
      hasImage: false,
      imageUrl: undefined,
      update: async () => {},
    };
  } else if (clerkUser.user) {
    user = {
      id: clerkUser.user.id,
      firstName: clerkUser.user.firstName || "User",
      lastName: clerkUser.user.lastName || "",
      fullName: clerkUser.user.fullName || clerkUser.user.firstName || "User",
      primaryEmailAddress: clerkUser.user.primaryEmailAddress
        ? { emailAddress: clerkUser.user.primaryEmailAddress.emailAddress }
        : undefined,
      hasImage: Boolean(clerkUser.user.hasImage),
      imageUrl: clerkUser.user.imageUrl,
      update: (d: any) => clerkUser.user!.update(d),
    };
  }

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        isLoaded,
        user,
        isReviewer,
        loginAsReviewer,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AuthContext);
}
