// Browser side of "new enquiry" phone alerts. Firebase Messaging is loaded only
// when someone turns alerts on or off, so other pages don't carry it.
import { app } from "@/lib/firebase";

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
const KEY = "proppage:push-token";

export type PushState = "unavailable" | "needs-install" | "off" | "on" | "blocked";

function storedToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function remember(token: string | null) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: alerts still work, the card just can't tell they're on.
  }
}

/** What the alerts card should offer on this phone. */
export async function pushState(): Promise<PushState> {
  if (!VAPID) return "unavailable";
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  if (ios && !installed) return "needs-install"; // iPhone only allows alerts from Home Screen apps
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unavailable";
  const { isSupported } = await import("firebase/messaging");
  if (!(await isSupported().catch(() => false))) return "unavailable";
  if (Notification.permission === "denied") return "blocked";
  return Notification.permission === "granted" && storedToken() ? "on" : "off";
}

/** Asks permission (call from a tap), registers this phone and saves it for the signed-in person. */
export async function turnOnPush(): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const { getMessaging, getToken } = await import("firebase/messaging");
  const token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: registration });
  if (!token) throw new Error("No token");
  const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
  if (!res.ok) throw new Error(await res.text());
  remember(token);
  return "on";
}

export async function turnOffPush(): Promise<PushState> {
  await forgetPushOnThisPhone();
  try {
    const { getMessaging, deleteToken } = await import("firebase/messaging");
    await deleteToken(getMessaging(app));
  } catch {
    // Already gone.
  }
  return "off";
}

/** On sign out: stop this phone getting the signed-out person's alerts. */
export async function forgetPushOnThisPhone() {
  const token = storedToken();
  if (!token) return;
  await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => {});
  remember(null);
}
