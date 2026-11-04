# Launch day: things only the owner can do

Placeholders to replace are marked `REPLACE-WITH-…` in `apphosting.yaml`, `.firebaserc` and `android/gradle.properties`.

## 1. Firebase production project

1. **Create a new Firebase project with a neutral ID** (e.g. `proppage-prod`); the old `dkpromoters-96ec1` must not be used (its ID shows in emails). Put it on **Blaze** with a budget alert.
2. Add a **Web app** in Project settings and copy its values into the `NEXT_PUBLIC_FIREBASE_*` lines of `apphosting.yaml`. Put the project ID in `.firebaserc`.
3. **Firestore** in `asia-south1` (Mumbai). **Storage**. **Authentication → Email/Password** on.
4. **Daily backups** (keeps 7 days):
   `gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=7d --project=<project-id>`
5. `firebase deploy --only firestore,storage` and wait until every index in the console shows "Enabled".

## 2. Domain and hosting

1. Buy / confirm the domain. Put it in `NEXT_PUBLIC_SITE_URL` (`apphosting.yaml`) and `proppageHost` (`android/gradle.properties`).
2. **App Hosting** backend `proppage-web` from GitHub; connect the domain.
3. **Authentication → Settings → Authorised domains**: add the domain (the "confirm your email" link returns agents to it).
4. `minInstances: 1` in `apphosting.yaml` keeps one server warm (small fixed monthly cost). Set 0 to pay only for visits.

## 3. Email (transactional service, not Gmail)

1. Create an account with a transactional email service that offers SMTP (ZeptoMail recommended; Amazon SES also works). Verify the domain there.
2. Add the **SPF, DKIM and DMARC** DNS records the service gives you; wait until it shows the domain as verified.
3. In `apphosting.yaml` fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` (copy them from the service's SMTP page) and `MAIL_FROM` (e.g. `PropPage <hello@your-domain>`). Store the SMTP password: `firebase apphosting:secrets:set smtp-password`.
4. **Authentication → Templates → SMTP settings**: use the same service and sender, so "confirm your email" and "reset password" mails come from your domain. Set the sender name to PropPage and edit the two templates (English + Tamil line).
5. Send yourself a test enquiry; check it arrives in the Gmail inbox (not spam) and the headers show SPF and DKIM "pass".

## 4. Secrets and contacts

1. `firebase apphosting:secrets:set gemini-api-key` with a **new** Gemini key (the one shown in chat on 3 Nov is exposed: delete it in AI Studio). Turn on billing for its Google Cloud project so Google's paid data terms apply.
2. `firebase apphosting:secrets:set cron-secret` (32+ random characters).
3. Fill `ADMIN_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_GRIEVANCE_OFFICER` in `apphosting.yaml`.
4. **Rotate every secret** in the old tracker repo's history (`/Volumes/Maddy/tracker/server/.env`) and make that repo private or purge the history.

## 5. Phone notifications for enquiries

1. Firebase console → Project settings → **Cloud Messaging** → Web Push certificates → **Generate key pair**. Put the public key in `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (`apphosting.yaml`).
2. Make sure the **Firebase Cloud Messaging API (V1)** is enabled for the project in Google Cloud.

## 6. Deploy and first admin

1. Deploy App Hosting. Create the admin with `npm run admin:recover` (a long, unique password: the admin login has no second factor).
2. **Cloud Scheduler**: daily 08:00 Asia/Kolkata, `POST https://<domain>/api/cron/daily` with header `Authorization: Bearer <cron-secret>`. Run it once with `?dry=1` first; it should answer `{"ok":true,"dry":true,…}`.
3. **Admin → Plans & settings**: UPI ID, payee name (QR is made from them), GSTIN if registered.

## 7. Android app download (direct APK)

The download links stay hidden until this is done. Full commands: `android/README.md`, "Build the APK for agents".

1. Set your domain as `proppageHost` in `android/gradle.properties`.
2. Create the signing key, outside the repo. **Back it up (USB stick + passwords in a password manager) before the first agent installs.** Without it no new APK installs over the old one.
3. `./gradlew assembleRelease`, then copy the APK to `public/downloads/PropPage-1.0.0.apk`.
4. In `apphosting.yaml`: the key's SHA-256 in `ANDROID_CERT_SHA256`, and `/downloads/PropPage-1.0.0.apk` in `NEXT_PUBLIC_ANDROID_APK_URL`. Deploy.
5. Check `https://<domain>/.well-known/assetlinks.json` shows the fingerprint.
6. On a Samsung and a Redmi or Vivo: install from `https://<domain>/app` and follow the steps on that page exactly. Check the app opens with no address bar and a new enquiry alert arrives. Fix any wrong button names in `components/app/GetAppPanel.tsx`, and the "5 MB" if the file is bigger.
7. Share the link `<domain>/app` with the pilot agents, not the APK file: agents should never install an APK sent on WhatsApp.

## 8. Go-live test (with a test agent, then delete it)

1. Sign up with a second email; confirm the email from the phone; the dashboard should notice without signing out.
2. Add a listing with photos; open the page link from another phone; send an enquiry.
3. The agent gets the email and the phone notification; the enquiry shows in "Enquiries".
4. Submit a payment with a made-up UTR, then choose "Not received" in Admin → Payments; check the agent gets the "We couldn't find your payment" email.
5. Delete the test agent (Account & data → Delete my account).

## 9. Later, not needed for the pilot

1. **Android app on Google Play** (`android/README.md`): developer account ($25; a personal account needs a 14-day closed test with 12 testers, and the pilot agents can be those testers). Give Play your own signing key so it can take over from the APK.
2. **Android developer verification, before Google's 2027 rollout reaches India** (no fixed date yet): verify your identity and register `com.rturox.proppage` with its signing key. After the rollout, phones make it hard to install APKs from unverified developers.
3. Name a **grievance officer** (privacy page); have Terms/Privacy reviewed; have a Tamil speaker read the Tamil screens (`lib/i18n/ta.ts`).
4. **Switch listing AI to Claude** after about 50 agents: `firebase apphosting:secrets:set anthropic-api-key`, uncomment `ANTHROPIC_API_KEY` in `apphosting.yaml`, set `LISTING_AI_PROVIDER` to `claude` (pick `LISTING_AI_MODEL` after `npm run eval:drafts`), redeploy.
5. Razorpay for automatic payments.
