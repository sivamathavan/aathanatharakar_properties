// Phone notifications ("new enquiry") through Firebase Cloud Messaging. Server only.
// Every phone that turned alerts on has one pushTokens/{id} doc: { uid, token }.
import { createHash } from "node:crypto";
import { getMessaging } from "firebase-admin/messaging";
import { adminApp, adminDb } from "@/lib/firebase-admin";

export const pushTokensCol = () => adminDb.collection("pushTokens");

/** Doc id for a device token (tokens are long and may contain characters ids can't). */
export const pushTokenId = (token: string) => `t_${createHash("sha256").update(token).digest("hex").slice(0, 40)}`;

export async function savePushToken(uid: string, token: string, userAgent: string) {
  await pushTokensCol().doc(pushTokenId(token)).set({ uid, token, userAgent: userAgent.slice(0, 160), createdAt: new Date() });
}

/** Removes a phone's token, only if it belongs to this person. */
export async function removePushToken(uid: string, token: string) {
  const ref = pushTokensCol().doc(pushTokenId(token));
  const snap = await ref.get();
  if (snap.exists && snap.data()!.uid === uid) await ref.delete();
}

// Tokens FCM says are gone for good (app uninstalled, alerts turned off in the browser).
const GONE = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

export type PushMessage = { title: string; body: string; link: string };

/**
 * Sends one notification to every phone this person turned alerts on for.
 * Data-only, so public/sw.js shows it the same way everywhere. Never throws;
 * returns how many phones accepted it.
 */
export async function sendPush(uid: string, msg: PushMessage): Promise<number> {
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") return 0; // FCM has no emulator
  try {
    const snap = await pushTokensCol().where("uid", "==", uid).limit(20).get();
    if (snap.empty) return 0;
    const res = await getMessaging(adminApp).sendEachForMulticast({
      tokens: snap.docs.map((d) => d.data().token as string),
      data: { title: msg.title, body: msg.body, link: msg.link },
      webpush: { headers: { Urgency: "high", TTL: String(24 * 60 * 60) } },
    });
    await Promise.all(
      res.responses.map((r, i) => (!r.success && GONE.has(r.error?.code || "") ? snap.docs[i].ref.delete().catch(() => {}) : null))
    );
    return res.successCount;
  } catch (error) {
    console.error("[PUSH]", error);
    return 0;
  }
}

/** For API routes: finish before the response goes out, but never wait longer than `ms`. */
export function sendPushWithin(uid: string, msg: PushMessage, ms = 4000): Promise<number> {
  return Promise.race([sendPush(uid, msg), new Promise<number>((resolve) => setTimeout(() => resolve(0), ms))]);
}
