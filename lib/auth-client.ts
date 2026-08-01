import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithCustomToken,
} from "firebase/auth";

export async function signInWithEmail(email: string, password: string) {
  // 1. Sign in to Firebase Auth on the client
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // 2. Retrieve ID token
  const idToken = await userCredential.user.getIdToken();

  // 3. Store ID token in secure HTTP-only cookie
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Clear client-side session if cookie setting fails
    await fbSignOut(auth);
    throw new Error(errorText || "Session synchronization failed");
  }

  const data = await res.json();
  return { user: userCredential.user, role: data.role };
}

export async function signOut() {
  // 1. Sign out of Firebase Auth client side
  await fbSignOut(auth);

  // 2. Clear token cookie
  await fetch("/api/auth/token", { method: "DELETE" });

  // 3. Force redirection & reload to clear client state
  window.location.href = "/";
}
