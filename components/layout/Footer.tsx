import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BRAND } from "@/lib/brand";
import { TN_CITIES } from "@/lib/constants";
import { APK_URL } from "@/lib/app-install";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-900 text-white border-t border-navy-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:py-14 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          <div className="space-y-3">
            <BrandLogo size="md" />
            <p className="text-sm text-gray-300 max-w-xs">{BRAND.tagline}. Made for property agents in Tamil Nadu.</p>
            <Link href="/register" className="inline-flex h-10 px-4 items-center rounded-btn bg-gold-500 text-navy-900 text-sm font-semibold">
              Start free trial
            </Link>
          </div>

          <div>
            <h4 className="font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Product</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-300">
              <li><Link href="/for-agents" className="hover:text-gold-400">For agents</Link></li>
              <li><Link href="/for-agents#pricing" className="hover:text-gold-400">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-gold-400">Agent login</Link></li>
              {APK_URL && <li><Link href="/app" className="hover:text-gold-400">Phone app</Link></li>}
              <li><Link href="/properties" className="hover:text-gold-400">Browse properties</Link></li>
              <li><Link href="/blog" className="hover:text-gold-400">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Top cities</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-300">
              {TN_CITIES.slice(0, 6).map((city) => (
                <li key={city}>
                  <Link href={`/properties?city=${city}`} className="hover:text-gold-400">{city}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link href="/about" className="hover:text-gold-400">About</Link></li>
              <li><Link href="/privacy" className="hover:text-gold-400">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold-400">Terms of service</Link></li>
              {BRAND.supportEmail && (
                <li><a href={`mailto:${BRAND.supportEmail}`} className="hover:text-gold-400 break-all">{BRAND.supportEmail}</a></li>
              )}
              {BRAND.supportWhatsapp && (
                <li><a href={`https://wa.me/${BRAND.supportWhatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold-400">WhatsApp support</a></li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-navy-800 text-xs text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
          <p>© {year} {BRAND.name}. All rights reserved.</p>
          <p>
            A product of{" "}
            <a href={BRAND.companyUrl} target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 font-medium">
              {BRAND.company}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
