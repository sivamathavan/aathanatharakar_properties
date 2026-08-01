# Changes — Launch Readiness Pass

A short reference for what was fixed and what you still need to do before
flipping the switch.

## Manual follow-ups

1. **Verify your `.env`** has these keys (most already present):
   - `NEXT_PUBLIC_SITE_URL` — canonical site URL (e.g. `https://www.dkpromoters.in`).
     Falls back to `NEXTAUTH_URL`. Used for sitemap, robots, OG tags.
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — broker WhatsApp/call number (digits only).
     Property cards and detail pages route every public contact to this.
   - `ADMIN_EMAIL` — every property/vendor lead is mirrored here.
   - `SMTP_*` — required for OTP emails. Without them, OTPs print to the
     server console.
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
     — image upload depends on both.

2. **Existing OTPs are invalidated.** OTPs are now hashed (SHA-256) before
   storage. Any prior `VerificationToken` rows must be cleared:
   ```sql
   DELETE FROM "VerificationToken";
   ```

3. **No new Prisma migrations are required** — schema is unchanged.

4. **Build verification:**
   ```
   npm run build
   ```
   Real TypeScript errors will now block the build (previously suppressed).

5. **Optional but recommended for production:**
   - Move OTP rate-limit + lockout state to Redis/Upstash for serverless.
     Today they live in-memory per Lambda; spamming an attacker who hops
     instances can still cause noise (bounded by Cloudflare / Vercel
     firewall in front).
   - Add hCaptcha or Cloudflare Turnstile to public enquiry + registration.
   - Generate proper PNG icons (192×192, 512×512) at `/public/icons/` for
     better PWA install on legacy Android. The SVG works in modern browsers.

## Major fixes shipped

- **Broker-only contact model** — all WhatsApp/Call/Enquiry buttons route to
  the broker (`NEXT_PUBLIC_WHATSAPP_NUMBER` / `ADMIN_EMAIL`). Owner contact
  is never exposed publicly; owners are notified that a lead arrived but do
  not receive buyer contact info. Footer + property cards display this
  promise.
- **Privilege escalation closed** — registration API now whitelists roles
  (`PROPERTY_LISTER | AGENT | VENDOR`); the client can no longer self-grant
  admin.
- **"Suspend" no longer deletes the user** — only `accountStatus` is
  changed. Admins cannot suspend themselves or other admins.
- **OTPs are hashed** — SHA-256 stored in `VerificationToken.token`. Old
  plain-text codes will appear invalid (clear the table; see above).
- **Anti-enumeration on /api/auth/send-otp** — always returns the same
  generic OK response. IP + email rate limits applied.
- **Lockouts + email case** — admin login lockout key and lookup now both
  use lower-cased trimmed email. Lockout records a fail on every wrong
  attempt.
- **Agent + Vendor registration** — added validations, separated
  `officeAddress` from `agencyName` (schema only has `officeAddress`),
  added "account pending review" notice.
- **Image upload bugs fixed** — Cloudinary `public_id` is captured properly
  (deletes will work), file type + size validated (10 MB images / 60 MB
  videos), better error toasts.
- **Mobile responsive** — EMI calculator, Share, "Book Site Visit", and
  broker-trust note are now visible on mobile (previously sidebar-only).
  Sell-your-property page rebranded and made mobile-friendly. Properties
  list uses paginated layout with mobile filter drawer that preserves
  search/sort.
- **Broker-vetted listings** — new agents and vendors start in `PENDING`
  status. Property listers stay `ACTIVE` since they go through admin
  property approval anyway.
- **Brand consistency** — orange `#E85D24` and green `#1D6A3A` accents
  removed from login, admin login, sell-your-property, new property,
  vendor enquiry form, services, blog detail.
- **Search + filters** — `/properties` now supports text search across
  title/locality/address/description, BHK filter, price range, and proper
  pagination (12/page).
- **PWA icons** — new SVG icon at `/public/icons/icon.svg`, manifest
  updated. Modern browsers + iOS will use it.
- **Blog 404s fixed** — all six static posts now render with full content
  via `lib/static-blog.ts`, used by both list and detail pages and the
  sitemap.
- **Sitemap + robots** — unified to a single `SITE_URL`, includes blog
  posts and disallows API + auth routes.
- **View count** — moved off the render thread to a debounced client-side
  ping (`/api/properties/[id]/view`). Once per IP per 30 minutes.
- **Branded 404 + error pages** — `/app/not-found.tsx` and `/app/error.tsx`.
- **Security headers** — X-Frame-Options, Referrer-Policy, X-Content-Type
  -Options, Permissions-Policy applied via `next.config.mjs`.

## What's intentionally left alone

- **Lead notes** still have no edit/delete UI. Low priority.
- **Drag-and-drop photo reorder** (dnd-kit is installed but unused).
  Add when you have time.
- **bcryptjs dep** is still used by admin login. Don't drop it.
- **Tamil-only `<html lang="ta">`** — left as is. Switch to `next-intl`
  later for true bilingual.
