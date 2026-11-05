/**
 * The caller's address, for rate limits and view counts. App Hosting sets
 * x-fah-client-ip itself. The start of x-forwarded-for comes from the caller, so
 * a faked value there would get around every limit; only its last entry is
 * added by our own hosting.
 */
export function clientIp(req: Request): string {
  const forwarded = (req.headers.get("x-forwarded-for") || "").split(",").map((ip) => ip.trim()).filter(Boolean);
  return req.headers.get("x-fah-client-ip")?.trim() || forwarded.at(-1) || req.headers.get("x-real-ip") || "unknown";
}
