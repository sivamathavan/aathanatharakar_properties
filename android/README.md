# PropPage for Android

The Play Store app is a **Trusted Web Activity**: it opens the PropPage website
full screen in the phone's Chrome. There is one codebase (the Next.js app in the
repo root); every web deploy reaches the Android app at once. Sign-in, photos,
WhatsApp, calls, Tamil and the offline page all work as on the web.

## What you need

- JDK 21 (`/opt/homebrew/opt/openjdk@21`) and the Android SDK (`~/Library/Android/sdk`)
- `android/local.properties` with `sdk.dir=/Users/<you>/Library/Android/sdk` (not in git)

## Test on the emulator against your local dev server

```bash
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
./gradlew assembleDebug -PproppageHost=localhost:3007 -PproppageScheme=http
~/Library/Android/sdk/emulator/emulator -avd Pixel_7 &
adb reverse tcp:3007 tcp:3007 && adb reverse tcp:9099 tcp:9099 && adb reverse tcp:9199 tcp:9199
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Local http builds show Chrome's address bar (the site can't be verified on
localhost). The live https build opens full screen.

## Build for Google Play

1. In `gradle.properties` set `proppageHost` to your domain (e.g. `proppage.in`).
   `proppageAppId` (`com.rturox.proppage`) can never change after the first upload.
2. Create your upload key once and keep it backed up (losing it means a key reset via Google):

   ```bash
   keytool -genkeypair -v -keystore ~/proppage-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

3. Create `android/keystore.properties` (never commit it):

   ```properties
   storeFile=/Users/<you>/proppage-upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```

4. Build the bundle and upload `app/build/outputs/bundle/release/app-release.aab`:

   ```bash
   ./gradlew bundleRelease
   ```

5. In Play Console → Test and release → App integrity, copy the **app signing key
   SHA-256** and set it on the website (`apphosting.yaml`):
   `ANDROID_PACKAGE_NAME=com.rturox.proppage`, `ANDROID_CERT_SHA256=<fingerprint>`.
   Check `https://<domain>/.well-known/assetlinks.json` shows it. Without this the
   app still works but shows an address bar.
6. Raise `proppageVersionCode` by 1 for every new upload. Most updates need no
   new upload at all: they ship with the website.
