import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

async function startSession(user: User): Promise<string> {
  // Force refresh so a role set moments ago (signup) is in the token.
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    await fbSignOut(auth);
    throw new Error((await res.text()) || "Could not start your session");
  }
  const data = await res.json();
  return data.role as string;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const role = await startSession(cred.user);
  return { user: cred.user, role };
}

export interface AgentSignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  agencyName: string;
  city: string;
}

/** Creates the Firebase account, the agent profile and a trial, then signs in. */
export async function signUpAgent(input: AgentSignupInput) {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  try {
    const idToken = await cred.user.getIdToken();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ name: input.name, phone: input.phone, agencyName: input.agencyName, city: input.city }),
    });
    if (!res.ok) throw new Error((await res.text()) || "Signup failed");
  } catch (err) {
    // Don't leave a half-made account behind.
    await cred.user.delete().catch(() => {});
    throw err;
  }
  await sendEmailVerification(cred.user).catch(() => {});
  const role = await startSession(cred.user);
  return { user: cred.user, role };
}

export async function signOut() {
  await fbSignOut(auth);
  await fetch("/api/auth/token", { method: "DELETE" });
  window.location.href = "/";
}

export function friendlyAuthError(err: any): string {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Wrong email or password.";
  if (code.includes("email-already-in-use")) return "An account with this email already exists. Sign in instead.";
  if (code.includes("weak-password")) return "Use a password of at least 8 characters.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a few minutes and try again.";
  if (code.includes("network")) return "No internet connection. Check your network and try again.";
  return err?.message || "Something went wrong. Please try again.";
}
