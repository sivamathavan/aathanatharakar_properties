// Which "get the app" offer this phone should see. The Android app is a thin shell
// around this website, so the site has to notice for itself when it is inside it.
const ANDROID_PACKAGE = "com.rturox.proppage";
const IN_APP_KEY = "proppage:in-android-app";

/** The signed APK (android/README.md). Empty hides every download link. */
export const APK_URL = (process.env.NEXT_PUBLIC_ANDROID_APK_URL || "").trim();

export type AppOffer = "installed" | "apk" | "android-chrome" | "iphone" | "desktop";

/**
 * True on the page the app opens. The app adds ?app=android to its address; the
 * referrer is the fallback for links the app opens, but it is blank when another
 * browser hosts the app.
 */
export function launchedFromApp(search: string, referrer: string): boolean {
  return new URLSearchParams(search).get("app") === "android" || referrer.replace(/\/$/, "") === `android-app://${ANDROID_PACKAGE}`;
}

export function appOfferFor({ userAgent, inApp, standalone, apkUrl }: { userAgent: string; inApp: boolean; standalone: boolean; apkUrl: string }): AppOffer {
  if (inApp || standalone) return "installed";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iphone";
  if (/Android/i.test(userAgent)) return apkUrl ? "apk" : "android-chrome";
  return "desktop";
}

// Kept per tab, not in localStorage: the app shares Chrome's storage, so a lasting
// flag could also hide the download in the agent's normal Chrome.
function inAndroidApp(): boolean {
  const launched = launchedFromApp(window.location.search, document.referrer);
  try {
    if (launched) sessionStorage.setItem(IN_APP_KEY, "1");
    return launched || sessionStorage.getItem(IN_APP_KEY) === "1";
  } catch {
    return launched;
  }
}

/** Browser only. Also remembers a launch from the app for the pages that follow. */
export function readAppOffer(): AppOffer {
  return appOfferFor({
    userAgent: navigator.userAgent,
    inApp: inAndroidApp(),
    standalone: window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    apkUrl: APK_URL,
  });
}
