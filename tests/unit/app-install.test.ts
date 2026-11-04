import { test } from "node:test";
import assert from "node:assert/strict";
import { appOfferFor, launchedFromApp } from "../../lib/app-install";

const ANDROID = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const APK = "/downloads/PropPage-1.0.0.apk";
const offer = (userAgent: string, over: Partial<{ inApp: boolean; standalone: boolean; apkUrl: string }> = {}) =>
  appOfferFor({ userAgent, inApp: false, standalone: false, apkUrl: APK, ...over });

test("Android in a browser gets the APK, or Chrome's install steps until one is set", () => {
  assert.equal(offer(ANDROID), "apk");
  assert.equal(offer(ANDROID, { apkUrl: "" }), "android-chrome");
});

test("iPhone and desktop never get the APK", () => {
  assert.equal(offer(IPHONE), "iphone");
  assert.equal(offer(DESKTOP), "desktop");
});

test("nothing is offered inside the app or an installed web app", () => {
  for (const userAgent of [ANDROID, IPHONE, DESKTOP]) {
    assert.equal(offer(userAgent, { inApp: true }), "installed");
    assert.equal(offer(userAgent, { standalone: true }), "installed");
  }
});

test("a launch from the app is noticed from the address or the referrer", () => {
  assert.equal(launchedFromApp("?app=android&v=1", ""), true);
  assert.equal(launchedFromApp("", "android-app://com.rturox.proppage/"), true);
  assert.equal(launchedFromApp("", "android-app://com.rturox.proppage"), true);
});

test("ordinary visits and other apps are not mistaken for the app", () => {
  assert.equal(launchedFromApp("", ""), false);
  assert.equal(launchedFromApp("?app=ios", ""), false);
  assert.equal(launchedFromApp("?next=/dashboard", "https://proppage.in/login"), false);
  assert.equal(launchedFromApp("", "android-app://com.whatsapp/"), false);
  assert.equal(launchedFromApp("", "android-app://com.rturox.proppage.fake/"), false);
});
