# Notes for whoever updates this manual

- `README.md` is the agent manual, `admin-guide.md` the admin guide. Both are Tanglish; button and screen names are copied exactly from the app (English labels, `lib/i18n/ta.ts` for the Tamil ones).
- Screenshots in `images/` were taken on 3 Nov 2026 from commit `17f8890` at 375px wide (2x), against the local emulators with made-up demo data (agent "Senthil Kumar, Sri Velan Properties, Coimbatore"; other agents Meena Realty, Arul Homes, Crescent Properties). No real people or numbers.
- The page link in the screenshots shows `proppage.in` only because `NEXT_PUBLIC_SITE_URL` was set to that for the shots. The live domain isn't chosen yet; retake the screenshots that show a link (overview, share, profile, poster) once it is.
- The "Speak or paste your listing" shot used the emulator stand-in (`LISTING_AI_FAKE`), so it shows "Not mentioned: locality". The real model fills more fields.
- Prices and limits in the text are the defaults in `lib/plans.ts` (trial 14 days / 5 listings / 6 photos / 10 voice listings; Starter ₹299 / ₹2,999, 25 / 10 / 50; Pro ₹699 / ₹6,999, 100 / 15 / 300; boost ₹149 a week). If the admin changes them in "Plans & settings", update sections 5, 6.2 and 14 of `README.md`.
- File names: `NN-*.jpg` are agent screens in the order they appear in `README.md`; `aNN-*.jpg` are admin screens.
