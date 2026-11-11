// Answers for the help chat. Written from what the product really does: the
// agent manual (docs/user-manual/README.md §14 and §17 FAQ) and the landing
// page FAQ (components/marketing/LandingSections.tsx). Pure: client and server.
//
// Every shown line goes through t(), so the Tamil team can translate it like
// any other agent screen. `keywords` are search aids only (English and the
// Tanglish agents type), never shown, so they are not translated.
import type { TFunc } from "@/lib/i18n";
import type { PlansConfig } from "@/types";
import { GRACE_DAYS } from "@/lib/plans";

export type HelpSurface = "dashboard" | "site";

export interface HelpLink {
  href: string;
  label: string;
}

export interface HelpTopic {
  id: string;
  q: string;
  a: string;
  keywords: string[];
  link?: HelpLink;
  /** Offer "Talk to a person" right under this answer. */
  contact?: boolean;
}

export interface HelpContext {
  surface: HelpSurface;
  brand: string;
  /** Prices and limits from config/plans. Without them, answers leave numbers out. */
  plans?: PlansConfig | null;
}

interface Def {
  id: string;
  on: HelpSurface[];
  keywords: string[];
  build: (t: TFunc, c: HelpContext) => Omit<HelpTopic, "id" | "keywords">;
}

const both: HelpSurface[] = ["dashboard", "site"];
const inApp = (c: HelpContext) => c.surface === "dashboard";

const DEFS: Def[] = [
  {
    id: "what",
    on: ["site"],
    keywords: ["what is", "how it works", "how does it work", "about", "website", "page", "link", "enna"],
    build: (t, c) => ({
      q: t("What is {brand}?", { brand: c.brand }),
      a: t("One page with all your listings, in your agency's name. Share its link on WhatsApp: clients see photos and prices, then call or WhatsApp you directly."),
      link: { href: "/for-agents", label: t("See how it works") },
    }),
  },
  {
    id: "skill",
    on: ["site"],
    keywords: ["technical", "skill", "computer", "website", "difficult", "easy", "phone only", "laptop"],
    build: (t, c) => ({
      q: t("Do I need a website or any technical skill?"),
      a: t("No. If you can send a WhatsApp message, you can use {brand}. Everything works from the browser on your phone.", { brand: c.brand }),
    }),
  },
  {
    id: "price",
    on: ["site"],
    keywords: ["price", "prices", "cost", "how much", "fees", "plan", "plans", "pricing", "starter", "pro", "rupees", "rs", "monthly", "yearly", "evvalavu", "vilai"],
    build: (t, c) => {
      const p = c.plans?.plans;
      return {
        q: t("How much does it cost?"),
        a: p
          ? t("Starter is {starter} a month and Pro is {pro} a month, less if you pay for a year. Start with a free trial; no card needed.", { starter: `₹${p.STARTER.priceMonthly}`, pro: `₹${p.PRO.priceMonthly}` })
          : t("There are two plans, Starter and Pro, paid monthly or yearly. Start with a free trial; no card needed."),
        link: { href: "/for-agents#pricing", label: t("See prices") },
      };
    },
  },
  {
    id: "paused",
    on: both,
    keywords: ["paused", "pause", "not showing", "not visible", "page off", "stopped", "blocked", "suspended", "page not working", "theriyala", "varala", "confirm email", "verify"],
    build: (t, c) => ({
      q: t("My page says it is paused. What do I do?"),
      a: t("There are two reasons. 1. Your email isn't confirmed: open the link in the email we sent, then tap \"I've confirmed my email\" on Overview. 2. Your plan ended more than {days} days ago: pay from Plan & billing, and the page comes back as soon as the payment is approved. If it says \"Your account is paused\", send us a message.", { days: GRACE_DAYS }),
      link: inApp(c) ? { href: "/dashboard/billing", label: t("Plan & billing") } : undefined,
      contact: true,
    }),
  },
  {
    id: "owner-phone",
    on: both,
    keywords: ["owner", "owner number", "owner phone", "private", "privacy", "survey", "secret", "hide number", "buyers see"],
    build: (t) => ({
      q: t("Can buyers see the owner's phone number?"),
      a: t("No. Owner name, owner phone, survey number, private notes, title documents and sold prices are only for you. Buyers see only your own WhatsApp and phone number."),
    }),
  },
  {
    id: "photos",
    on: ["dashboard"],
    keywords: ["photo", "photos", "image", "picture", "upload", "uploading", "not uploading", "aagala", "jpg", "png"],
    build: (t, c) => {
      const p = c.plans?.plans;
      return {
        q: t("My photos won't upload."),
        a: p
          ? t("Check your internet and try again. Use JPG, PNG or WebP photos under 20 MB. Each listing can have {trial} photos on the free trial, {starter} on Starter and {pro} on Pro. If it still fails, try the Chrome browser.", { trial: p.TRIAL.photoLimit, starter: p.STARTER.photoLimit, pro: p.PRO.photoLimit })
          : t("Check your internet and try again. Use JPG, PNG or WebP photos under 20 MB, within your plan's photo limit. If it still fails, try the Chrome browser."),
      };
    },
  },
  {
    id: "enquiries",
    on: ["dashboard"],
    keywords: ["enquiry", "enquiries", "inquiry", "lead", "leads", "notification", "alert", "alerts", "know", "email", "client message"],
    build: (t) => ({
      q: t("How do I know when an enquiry comes?"),
      a: t("We email you every enquiry, and the count on Enquiries goes up. If Overview shows \"Turn on enquiry alerts\", turn it on to get a notification on this phone. A morning email lists the day's follow-ups and site visits."),
      link: { href: "/dashboard/enquiries", label: t("Enquiries") },
    }),
  },
  {
    id: "add",
    on: ["dashboard"],
    keywords: ["add", "add property", "new listing", "post", "upload property", "speak", "paste", "voice", "fill", "form", "listing"],
    build: (t) => ({
      q: t("How do I add a property quickly?"),
      a: t("Tap Add. In \"Speak or paste your listing\", speak in Tamil or English, or paste the owner's WhatsApp message, and the form fills itself. Check every field, add photos, then publish."),
      link: { href: "/dashboard/properties/new", label: t("Add property") },
    }),
  },
  {
    id: "mic",
    on: ["dashboard"],
    keywords: ["mic", "microphone", "voice", "speak", "speaking", "dictation", "talk", "pesi", "not typing", "sound"],
    build: (t) => ({
      q: t("Voice typing doesn't work."),
      a: t("Use the Chrome browser and tap Allow when it asks for the microphone. You can also paste the owner's WhatsApp message, or type."),
    }),
  },
  {
    id: "tamil",
    on: both,
    keywords: ["tamil", "language", "english", "தமிழ்", "mozhi", "translate"],
    build: (t, c) => ({
      q: t("Can I use it in Tamil?"),
      a: inApp(c)
        ? t("Yes. On a phone open More, then Language, then தமிழ். On a computer it is in the left menu. You can also speak listings in Tamil.")
        : t("Yes. Switch your screens to தமிழ் from the menu, speak your listings in Tamil, and write descriptions in Tamil or English."),
    }),
  },
  {
    id: "link-name",
    on: both,
    keywords: ["link", "link name", "slug", "url", "change link", "rename", "address", "page name"],
    build: (t, c) => ({
      q: t("Can I change my link name?"),
      a: t("Yes, once, from Profile & branding, under \"Choose your link name\". Links you have already shared keep working."),
      link: inApp(c) ? { href: "/dashboard/profile", label: t("Profile & branding") } : undefined,
    }),
  },
  {
    id: "share",
    on: ["dashboard"],
    keywords: ["share", "sharing", "whatsapp", "poster", "visiting card", "qr", "send link", "status"],
    build: (t) => ({
      q: t("How do I share my page?"),
      a: t("Open Share my page. Copy your link or send it on WhatsApp, or download a poster or visiting card with your QR code."),
      link: { href: "/dashboard/share", label: t("Share my page") },
    }),
  },
  {
    id: "pay",
    on: both,
    keywords: ["pay", "payment", "upi", "gpay", "phonepe", "paytm", "qr", "renew", "subscribe", "buy plan", "utr", "how to pay"],
    build: (t, c) => ({
      q: t("How do I pay?"),
      a: t("By UPI, from Plan & billing: choose the plan, scan the QR code or open your UPI app, pay, then enter the 12-digit UTR from your UPI app and tap \"I have paid\". We check it and switch your plan on, usually within a few hours."),
      link: inApp(c) ? { href: "/dashboard/billing", label: t("Plan & billing") } : undefined,
    }),
  },
  {
    id: "paid-waiting",
    on: ["dashboard"],
    keywords: ["paid", "payment done", "not activated", "not active", "being checked", "pending", "utr", "not found", "approved", "pay panniten", "maaralai"],
    build: (t) => ({
      q: t("I paid, but my plan hasn't changed."),
      a: t("If Payment history says \"Being checked\", please wait a few hours while we match it with the bank. Check that the UTR you entered is right. If it says \"Not found — please contact us\", send us a message with the UTR, amount and date."),
      link: { href: "/dashboard/billing", label: t("Plan & billing") },
      contact: true,
    }),
  },
  {
    id: "renew-early",
    on: ["dashboard"],
    keywords: ["early", "renew early", "lose days", "extend", "before", "remaining days", "seekiram"],
    build: (t) => ({
      q: t("If I renew early, do I lose days?"),
      a: t("No. Paying before your plan ends adds the new time on top of your current end date."),
    }),
  },
  {
    id: "plan-ends",
    on: both,
    keywords: ["trial ends", "plan ends", "expired", "expire", "expiry", "end", "after trial", "grace", "mudinjaa", "renew", "not paid"],
    build: (t) => ({
      q: t("What happens when my trial or plan ends?"),
      a: t("Your page stays live for {days} more days, so links you shared still work. In that time you can edit and mark listings sold, but not add new ones. Then the page pauses for buyers. Nothing is deleted, and it comes back as soon as your payment is approved.", { days: GRACE_DAYS }),
    }),
  },
  {
    id: "contract",
    on: ["site"],
    keywords: ["contract", "auto debit", "autodebit", "auto-debit", "cancel", "subscription", "lock", "commitment", "card"],
    build: (t) => ({
      q: t("Is there a contract or auto-debit?"),
      a: t("Neither. You pay for a month or a year at a time. If you don't renew, the plan simply ends."),
    }),
  },
  {
    id: "limit",
    on: ["dashboard"],
    keywords: ["limit", "listing limit", "maximum", "max", "more listings", "can't add", "cannot add", "slots", "full", "upgrade"],
    build: (t, c) => {
      const p = c.plans?.plans;
      return {
        q: t("I've reached my listing limit."),
        a: p
          ? t("Mark sold or rented listings with \"Mark sold\" or \"Mark rented\" (that frees a slot), delete ones you no longer need, or move up a plan: Starter allows {starter} listings and Pro {pro}.", { starter: p.STARTER.listingLimit, pro: p.PRO.listingLimit })
          : t("Mark sold or rented listings with \"Mark sold\" or \"Mark rented\" (that frees a slot), delete ones you no longer need, or move up a plan."),
        link: { href: "/dashboard/properties", label: t("My properties") },
      };
    },
  },
  {
    id: "hide",
    on: ["dashboard"],
    keywords: ["hide", "hidden", "remove for now", "temporarily", "pause listing", "unpublish", "maraikka"],
    build: (t) => ({
      q: t("How do I hide a property for a while?"),
      a: t("Tap Hide on the listing in My properties. Tap \"Make live\" to show it again."),
      link: { href: "/dashboard/properties", label: t("My properties") },
    }),
  },
  {
    id: "sold-link",
    on: ["dashboard"],
    keywords: ["sold", "rented", "sold link", "old link", "after selling", "mark sold"],
    build: (t) => ({
      q: t("What happens to a sold property's link?"),
      a: t("It keeps working: it says the property is sold and shows your other listings below, so clients still reach you. Sold and rented listings don't count towards your plan's limit."),
    }),
  },
  {
    id: "boost",
    on: ["dashboard"],
    keywords: ["boost", "home page", "promote", "featured", "top", "advertise", "more views"],
    build: (t, c) => ({
      q: t("What is Boost?"),
      a: c.plans
        ? t("Boost shows one listing on the {brand} home page and search, with your number, for the weeks you pay for: {price} a week. Tap Boost on a live listing.", { brand: c.brand, price: `₹${c.plans.boostPricePerWeek}` })
        : t("Boost shows one listing on the {brand} home page and search, with your number, for the weeks you pay for. Tap Boost on a live listing.", { brand: c.brand }),
    }),
  },
  {
    id: "trials",
    on: both,
    keywords: ["free trial", "trial", "second trial", "another trial", "new account", "free", "rendaavadhu"],
    build: (t, c) => ({
      q: t("How many free trials can I take?"),
      a: c.plans
        ? t("One per mobile number: {days} days with {n} listings to try everything.", { days: c.plans.trialDays, n: c.plans.plans.TRIAL.listingLimit })
        : t("One per mobile number."),
    }),
  },
  {
    id: "password",
    on: both,
    keywords: ["password", "forgot", "forgot password", "reset", "login", "sign in", "can't login", "cannot login", "marandhuten"],
    build: (t, c) => ({
      q: t("I forgot my password."),
      a: t("On the Sign in page, type your email and tap \"Forgot password\". We email you a link to set a new one."),
      link: inApp(c) ? undefined : { href: "/login", label: t("Sign in") },
    }),
  },
  {
    id: "too-many-signups",
    on: ["site"],
    keywords: ["too many signups", "signup", "sign up", "register", "network", "wifi", "error", "can't register"],
    build: (t) => ({
      q: t("Signing up says \"Too many signups from this network\"."),
      a: t("Many accounts were made from the same Wi-Fi. Wait an hour, or try again on mobile data."),
    }),
  },
  {
    id: "app",
    on: both,
    keywords: ["app", "install", "home screen", "download app", "android", "iphone", "play store", "shortcut"],
    build: (t, c) => ({
      q: t("Can I keep it on my phone like an app?"),
      a: t("Yes. Open {brand} in Chrome, or Safari on iPhone, and add it to your home screen. It opens like an app, without the browser bar.", { brand: c.brand }),
    }),
  },
  {
    id: "data",
    on: ["dashboard"],
    keywords: ["delete account", "close account", "download data", "export", "my data", "remove account", "privacy"],
    build: (t) => ({
      q: t("How do I download or delete my data?"),
      a: t("Open Account & data. \"Download my data\" gives you one file with everything. \"Delete my account\" removes your page, listings, photos, enquiries and login for good."),
      link: { href: "/dashboard/account", label: t("Account & data") },
    }),
  },
];

/** First chips shown when the chat opens. */
export const STARTERS: Record<HelpSurface, string[]> = {
  dashboard: ["paused", "paid-waiting", "photos", "limit", "enquiries", "tamil"],
  site: ["what", "price", "plan-ends", "owner-phone", "tamil", "contract"],
};

export function helpTopics(t: TFunc, ctx: HelpContext): HelpTopic[] {
  return DEFS.filter((d) => d.on.includes(ctx.surface)).map((d) => ({ id: d.id, keywords: d.keywords, ...d.build(t, ctx) }));
}
