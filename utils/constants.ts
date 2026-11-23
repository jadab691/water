import logo from "@/assets/images/logo.png";

/**
 * Application Environment Configuration
 * Bundled directly into the app binary — no .env file required.
 */
export const ENV = {
  // Clerk Authentication Publishable Key
  CLERK_PUBLISHABLE_KEY: "pk_test_aG9seS12ZXJ2ZXQtNjAuY2xlcmsuYWNjb3VudHMuZGV2JA",
} as const;

export const CLERK_PUBLISHABLE_KEY = ENV.CLERK_PUBLISHABLE_KEY;

export { logo };
