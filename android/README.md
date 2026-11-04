# PropPage for Android

The app is a **Trusted Web Activity**: it opens the PropPage website full screen
in the phone's Chrome. There is one codebase (the Next.js app in the repo root);
every web deploy reaches the Android app at once. Sign-in, photos, WhatsApp,
calls, Tamil and the offline page all work as on the web.

Agents get it as a direct APK from the website's `/app` page. Google Play comes
later (see the end of this file).

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

## Build the APK for agents

1. In `gradle.properties` set `proppageHost` to your domain (e.g. `proppage.in`).
   `proppageAppId` (`com.rturox.proppage`) can never change after the first agent installs.
2. Create the app's signing key once. Keep it outside the repo and off the external
   drive, keep a second copy offline (USB stick), and keep the passwords in a password
   manager. **If this key is lost, no new APK will install over the old one**: every
   agent would have to uninstall and install again.

   ```bash
   mkdir -p ~/Secure/proppage
   keytool -genkeypair -v -keystore ~/Secure/proppage/proppage-signing.jks -alias proppage -keyalg RSA -keysize 2048 -validity 10000
   ```

3. Create `android/keystore.properties` (never commit it; `chmod 600` it):

   ```properties
   storeFile=/Users/<you>/Secure/proppage/proppage-signing.jks
   storePassword=...
   keyAlias=proppage
   keyPassword=...
   ```

4. Build it and check who signed it:

   ```bash
   ./gradlew assembleRelease
   ~/Library/Android/sdk/build-tools/37.0.0/apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
   ```

5. Copy `app/build/outputs/apk/release/app-release.apk` to
   `public/downloads/PropPage-1.0.0.apk`. Put the version in the name: downloads
   are cached for a year, so a new version needs a new name.
6. Get the key's SHA-256 (the `SHA256:` line) and set both values in `apphosting.yaml`:

   ```bash
   keytool -list -v -keystore ~/Secure/proppage/proppage-signing.jks -alias proppage
   ```

   - `ANDROID_CERT_SHA256=<fingerprint>` (public, safe to commit)
   - `NEXT_PUBLIC_ANDROID_APK_URL=/downloads/PropPage-1.0.0.apk` (empty hides every download link)

7. Deploy. Check `https://<domain>/.well-known/assetlinks.json` shows the fingerprint,
   then install from `https://<domain>/app` on a real phone. Without the right
   fingerprint the app still works but shows an address bar.

## A new APK

Most updates need no new APK: they ship with the website. Only a change to the icon,
name, domain, launch address or the Android libraries does.

1. Raise `proppageVersionCode` by 1 and set `proppageVersionName`.
2. Build with the **same key**. Android refuses to install over the old app otherwise.
3. Add the new file to `public/downloads/` under a new name, point
   `NEXT_PUBLIC_ANDROID_APK_URL` at it, and deploy. Sideloaded apps don't update
   themselves: agents install the new file from `/app`.

## Google Play, later

The plan is one signing key for the APK and Play, so Play can take over from the APK.

1. At the first upload, in Play App Signing, choose to use your own key ("Export and
   upload a key from Java keystore", with Google's PEPK tool) and give it
   `proppage-signing.jks`. Test on a phone that Play can update an APK install.
2. Create a separate upload key, point `keystore.properties` at it and run
   `./gradlew bundleRelease`. Upload `app/build/outputs/bundle/release/app-release.aab`.
3. If Play ends up with a different signing key, copy its SHA-256 from Play Console →
   Test and release → App integrity and add it after a comma:
   `ANDROID_CERT_SHA256=<APK key>,<Play key>`. Keep the APK key in the list while
   APK installs remain. Those agents uninstall the APK and install from Play once.
4. Raise `proppageVersionCode` by 1 for every upload.

**Android developer verification:** Google's rollout reaches India in 2027 (no fixed
date yet). After that, phones make it hard to install apps from unverified developers.
Verify your identity and register `com.rturox.proppage` with its signing key before then.
