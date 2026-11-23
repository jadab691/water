import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  signOut: async () => {},
});

const OFFLINE_USER_KEY = "smart-hydrate.offline-user";
const CLERK_LOAD_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerkAuth = useClerkAuth({ treatPendingAsSignedOut: false });
  const clerkUser = useClerkUser();
  const [cachedUser, setCachedUser] = useState<AppUser | null>(null);
  const [offlineUserLoaded, setOfflineUserLoaded] = useState(false);
  const [clerkLoadTimedOut, setClerkLoadTimedOut] = useState(false);

  useEffect(() => {
    let active = true;

    SecureStore.getItemAsync(OFFLINE_USER_KEY)
      .then((value) => {
        if (!active || !value) return;

        try {
          const parsed = JSON.parse(value) as Partial<AppUser>;
          if (typeof parsed.id !== "string" || !parsed.id.trim()) {
            throw new Error("Cached offline user has no valid ID.");
          }

          setCachedUser({
            id: parsed.id,
            firstName:
              typeof parsed.firstName === "string" ? parsed.firstName : "User",
            lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
            fullName:
              typeof parsed.fullName === "string" ? parsed.fullName : "User",
            primaryEmailAddress:
              parsed.primaryEmailAddress &&
              typeof parsed.primaryEmailAddress.emailAddress === "string"
                ? parsed.primaryEmailAddress
                : undefined,
          });
        } catch (error) {
          console.error("Could not read the saved offline user:", error);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not access the saved offline user:", error);
      })
      .finally(() => {
        if (active) setOfflineUserLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (clerkAuth.isLoaded) {
      return;
    }

    const timeout = setTimeout(
      () => setClerkLoadTimedOut(true),
      CLERK_LOAD_TIMEOUT_MS,
    );
    return () => clearTimeout(timeout);
  }, [clerkAuth.isLoaded]);

  const clerkUserId = clerkUser.user?.id;
  const clerkFirstName = clerkUser.user?.firstName || "User";
  const clerkLastName = clerkUser.user?.lastName || "";
  const clerkFullName =
    clerkUser.user?.fullName || clerkUser.user?.firstName || "User";
  const clerkEmail = clerkUser.user?.primaryEmailAddress?.emailAddress;

  const clerkAppUser: AppUser | null = clerkUser.user
    ? {
        id: clerkUser.user.id,
        firstName: clerkFirstName,
        lastName: clerkLastName,
        fullName: clerkFullName,
        primaryEmailAddress: clerkEmail
          ? { emailAddress: clerkEmail }
          : undefined,
        hasImage: Boolean(clerkUser.user.hasImage),
        imageUrl: clerkUser.user.imageUrl,
        update: (data: any) => clerkUser.user!.update(data),
      }
    : null;

  useEffect(() => {
    if (!clerkAuth.isSignedIn || !clerkUserId) return;

    const offlineProfile: AppUser = {
      id: clerkUserId,
      firstName: clerkFirstName,
      lastName: clerkLastName,
      fullName: clerkFullName,
      primaryEmailAddress: clerkEmail
        ? { emailAddress: clerkEmail }
        : undefined,
    };

    SecureStore.setItemAsync(OFFLINE_USER_KEY, JSON.stringify(offlineProfile))
      .then(() => setCachedUser(offlineProfile))
      .catch((error: unknown) => {
        console.error("Could not save the offline user:", error);
      });
  }, [
    clerkAuth.isSignedIn,
    clerkUserId,
    clerkFirstName,
    clerkLastName,
    clerkFullName,
    clerkEmail,
  ]);

  const signOut = async () => {
    if (clerkAuth.isSignedIn) {
      await clerkAuth.signOut();
    }
    setCachedUser(null);
    await SecureStore.deleteItemAsync(OFFLINE_USER_KEY);
  };

  const user = clerkAppUser ?? (clerkAuth.isSignedIn ? null : cachedUser);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: Boolean(clerkAuth.isSignedIn || cachedUser),
        isLoaded:
          offlineUserLoaded && (clerkAuth.isLoaded || clerkLoadTimedOut),
        user,
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
