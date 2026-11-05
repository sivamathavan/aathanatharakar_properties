// Firebase Client SDK — browser-safe initialization
// Used by all client components and pages
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase — singleton guard for Next.js HMR / SSR
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export { app };

export const auth = getAuth(app);
export const storage = getStorage(app);

// Local development against the Firebase emulators (never in production builds).
const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "true";
if (useEmulators && typeof window !== "undefined" && !(globalThis as any).__fbEmulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  (globalThis as any).__fbEmulatorsConnected = true;
}

// Google Analytics: only when NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is set. Without this
// check the SDK finds the ID by itself and adds cookies the privacy page doesn't mention.
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && !useEmulators && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };

export default app;
