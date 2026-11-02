import { NextResponse } from "next/server";

// Digital Asset Links: proves to Android that the Play Store app and this site
// belong together, so the app opens full screen (no browser address bar).
//   ANDROID_PACKAGE_NAME   e.g. com.rturox.proppage
//   ANDROID_CERT_SHA256    signing-key fingerprints, comma separated: the Play
//                          App Signing key (Play Console → App integrity) and,
//                          optionally, your upload key
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = (process.env.ANDROID_PACKAGE_NAME || "").trim();
  const fingerprints = (process.env.ANDROID_CERT_SHA256 || "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
  if (!pkg || fingerprints.length === 0) return NextResponse.json([], { headers: { "Cache-Control": "public, max-age=300" } });
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: fingerprints },
      },
    ],
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
