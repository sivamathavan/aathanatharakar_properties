# Launch day: things only the owner can do

1. **New Firebase project with a neutral ID** (e.g. `proppage-prod`). The current `dkpromoters-96ec1` shows in password-reset and verify emails; it is empty, so nothing moves. Put it on **Blaze** with a budget alert, then update the `NEXT_PUBLIC_FIREBASE_*` values in `apphosting.yaml`.
2. **Firestore in `asia-south1`** (the Firestore API is not enabled yet), Storage, Email/Password sign-in, authorised domain, email templates (sender name).
3. **App Hosting** backend `proppage-web` from GitHub; connect the domain; set `NEXT_PUBLIC_SITE_URL`.
4. **Secrets**: `firebase apphosting:secrets:set smtp-password`, `anthropic-api-key`, `cron-secret` (32+ random characters). Fill `ADMIN_EMAIL`, `SMTP_USER`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_GRIEVANCE_OFFICER` in `apphosting.yaml`.
5. `firebase deploy --only firestore,storage` and wait for indexes to build; then deploy App Hosting; create the admin with `npm run admin:recover`.
6. **Cloud Scheduler**: daily 08:00 Asia/Kolkata, `POST https://<domain>/api/cron/daily` with header `Authorization: Bearer <cron-secret>` (plan reminders and the follow-up digest).
7. **UPI ID, payee name, QR** (and GSTIN if registered) in Admin → Plans & settings.
8. **Rotate every secret** in the old tracker repo's history (`/Volumes/Maddy/tracker/server/.env`) and make that repo private or purge the history.
9. Name a **grievance officer** (privacy page); have Terms/Privacy reviewed; have a Tamil speaker read the Tamil screens (`lib/i18n/ta.ts`).
10. Later: Razorpay for automatic payments.
