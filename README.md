# PropPage

Property pages for real-estate agents in Tamil Nadu. Each agent lists their
plots, houses and rentals once and shares one link with clients on WhatsApp.
The platform owner runs a back office (the Tracker) and approves UPI payments.

The product name, tagline and support contact live in `lib/brand.ts` and can be
changed with `NEXT_PUBLIC_*` variables (see `.env.example` and `apphosting.yaml`).

## What's inside

| Who | Where | What |
|---|---|---|
| Visitors | `/`, `/properties`, `/a/{agent}` | Browse listings, call or WhatsApp the agent, send an enquiry |
| Agents | `/register`, `/dashboard` | Free trial, listings with photos, enquiries inbox, share link + QR, plan & billing (UPI + UTR) |
| Admin | `/admin` | Overview, own listings, website enquiries, agents, payment approval, plans & prices, Tracker |
| Admin | `/admin/tracker` | People, deals, property documents, buyer matching, commission ledger, analytics, expenses |

## Stack

- Next.js 14 (App Router) on Firebase App Hosting
- Firestore (server-only access through firebase-admin), Firebase Auth, Firebase Storage
- Roles come from server-set custom claims; sessions use 14-day Firebase session cookies
- Tailwind CSS; charts with Recharts; CSV/PDF exports with papaparse and jsPDF

## Run locally (emulators, never touches production)

```bash
npm install
npm run emulators            # auth, firestore (8282), storage (9199); needs JDK 21
npm run dev -- -p 3007       # with .env.development.local pointing at the emulators
```

Create an admin:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run admin:recover
```

## Tests

```bash
npm test                     # commission maths and plan dates
npm run test:rules           # Firestore + Storage security rules (emulators)
node tests/e2e/smoke.mjs     # 54 end-to-end checks against the running dev server
```

## Deploy

1. Firebase project on the Blaze plan, Firestore in `asia-south1`, Email/Password sign-in on.
2. Set `NEXT_PUBLIC_SITE_URL`, brand and email values in `apphosting.yaml`, and the SMTP password secret:
   `firebase apphosting:secrets:set smtp-password`
3. `firebase deploy --only firestore,storage` (rules + indexes), wait for indexes to finish building.
4. `firebase deploy --only apphosting`
5. Create the admin with `npm run admin:recover` using production credentials.
