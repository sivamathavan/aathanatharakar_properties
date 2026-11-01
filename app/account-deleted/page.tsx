import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Account deleted", robots: { index: false } };

export default function AccountDeletedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-warm-cream px-4">
      <div className="max-w-md text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-navy-900">Your account has been deleted</h1>
        <p className="text-sm text-navy-700">Your page, listings, photos and client data are gone. Thank you for using {BRAND.name}.</p>
        <Link href="/" className="inline-flex h-11 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">Go to the home page</Link>
      </div>
    </div>
  );
}
