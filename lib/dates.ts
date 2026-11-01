// India-time day helpers. Servers run in UTC, agents live in IST (UTC+5:30, no DST),
// so "today" and "due" are always worked out in IST. Pure: safe for client and server.
const IST_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-11-01" for the IST calendar day the instant falls on. */
export function istDayKey(d: Date | string | number = new Date()): string {
  return new Date(new Date(d).getTime() + IST_MS).toISOString().slice(0, 10);
}

/** The instant IST midnight starts on that IST day (+ n days). */
export function istDayStart(d: Date | string | number = new Date(), addDays = 0): Date {
  const key = istDayKey(d);
  return new Date(Date.parse(`${key}T00:00:00Z`) - IST_MS + addDays * DAY_MS);
}

/** Whole IST days from today to the given instant (0 = today, 1 = tomorrow, -1 = yesterday). */
export function istDaysFromToday(d: Date | string | number, now: Date = new Date()): number {
  return Math.round((istDayStart(d).getTime() - istDayStart(now).getTime()) / DAY_MS);
}

export type FollowUpState = "overdue" | "today" | "later" | null;

export function followUpState(at: Date | string | null | undefined, now: Date = new Date()): FollowUpState {
  if (!at) return null;
  const days = istDaysFromToday(at, now);
  return days < 0 ? "overdue" : days === 0 ? "today" : "later";
}

/** "Today", "Tomorrow", "Mon 3 Nov" — in IST. */
export function friendlyDay(d: Date | string, now: Date = new Date(), words = { today: "Today", tomorrow: "Tomorrow", yesterday: "Yesterday" }): string {
  const days = istDaysFromToday(d, now);
  if (days === 0) return words.today;
  if (days === 1) return words.tomorrow;
  if (days === -1) return words.yesterday;
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export function istTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}
