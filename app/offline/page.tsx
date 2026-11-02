import { BRAND } from "@/lib/brand";

export const metadata = { title: "You're offline", robots: { index: false } };

// Shown by the service worker (public/sw.js) when a page can't load.
// Static, no data: it must render from the cache with no network at all.
export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-warm-cream px-4">
      <div className="max-w-sm text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-navy-900">You&apos;re offline</h1>
        <p className="text-sm text-navy-700">
          {BRAND.name} needs the internet to show your listings and enquiries. Check your mobile data or Wi-Fi and try again.
        </p>
        <p lang="ta" className="text-sm text-navy-700" style={{ fontFamily: "var(--font-tamil), sans-serif" }}>இணைய இணைப்பு இல்லை. மொபைல் டேட்டா அல்லது Wi-Fi-ஐச் சரிபார்த்து மீண்டும் முயலுங்கள்.</p>
        <a href="/dashboard" className="inline-flex h-11 px-5 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">Try again</a>
      </div>
    </div>
  );
}
