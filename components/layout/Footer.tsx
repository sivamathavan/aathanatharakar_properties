import Link from "next/link";
import { TN_CITIES } from "@/lib/constants";
import { Heart, ShieldCheck } from "lucide-react";
import { MonogramIcon } from "@/components/brand/MonogramIcon";

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white border-t border-navy-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:py-16 max-w-7xl mx-auto">

        {/* Desktop logo row */}
        <div className="hidden md:flex justify-between items-center pb-8 border-b border-navy-800 mb-10">
          <div>
            <div className="flex items-center space-x-3">
              <MonogramIcon className="w-10 h-10" />
              <span className="font-sans font-bold text-2xl text-white tracking-wide">
                Aadana<span className="text-gold-500">Tharakar</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 pl-13">Tamil Nadu's Trusted Property Marketplace</p>
          </div>
          {/* Social — Instagram only (no X or LinkedIn) */}
          <div className="flex gap-3">
            <a href="https://www.facebook.com/aadanatharakar" target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/aadanatharakar" target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Grid columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 font-sans">

          {/* Mobile: logo + social */}
          <div className="md:hidden space-y-4 text-center pb-6 border-b border-navy-800">
            <div className="flex flex-col items-center gap-2">
              <MonogramIcon className="w-12 h-12" />
              <span className="font-sans font-bold text-xl text-white tracking-wide">
                Aadana<span className="text-gold-500">Tharakar</span>
              </span>
            </div>
            <p className="text-xs text-gray-400">Tamil Nadu's Trusted Property Marketplace</p>
            <div className="flex gap-3 justify-center pt-1">
              <a href="https://www.facebook.com/aadanatharakar" target="_blank" rel="noopener noreferrer"
                 className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/aadanatharakar" target="_blank" rel="noopener noreferrer"
                 className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="border-t border-navy-800 pt-6 md:border-t-0 md:pt-0">
            <h4 className="font-sans font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-400">
              <li><Link href="/properties" className="hover:text-gold-500 transition-colors">Properties</Link></li>
              <li><Link href="/services" className="hover:text-gold-500 transition-colors">Allied Services</Link></li>
              <li><Link href="/blog" className="hover:text-gold-500 transition-colors">Blog</Link></li>
              <li><Link href="/about" className="hover:text-gold-500 transition-colors">About Us</Link></li>
              <li><Link href="/sell-your-property" className="hover:text-gold-500 transition-colors">List Property</Link></li>
            </ul>
          </div>

          {/* Top Cities */}
          <div className="border-t border-navy-800 pt-6 md:border-t-0 md:pt-0">
            <h4 className="font-sans font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Top Cities</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-400">
              {TN_CITIES.slice(0, 6).map(city => (
                <li key={city}>
                  <Link href={`/properties?city=${city}`} className="hover:text-gold-500 transition-colors">{city}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="border-t border-navy-800 pt-6 md:border-t-0 md:pt-0">
            <h4 className="font-sans font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-gold-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold-500 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="border-t border-navy-800 pt-6 md:border-t-0 md:pt-0">
            <h4 className="font-sans font-semibold text-gold-500 text-sm mb-4 uppercase tracking-wider">Contact Us</h4>
            <div className="text-sm text-gray-400 space-y-2.5">
              <p><strong className="text-gray-200 block">Tamilarasan (Founder)</strong>Vadavalli, Coimbatore - 641041<br/>Tamil Nadu</p>
              <p>
                <a href="tel:+916382987874" className="hover:text-gold-500 transition-colors block">📞 +91 63829 87874</a>
                <a href="tel:+916381169124" className="hover:text-gold-500 transition-colors block">📞 +91 63811 69124</a>
              </p>
              <p>
                <a href="mailto:aadanatharakarproperty@gmail.com" className="hover:text-gold-500 transition-colors break-all">
                  ✉️ aadanatharakarproperty@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-navy-800 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-500" />
          All buyer enquiries are managed by Aadana Tharakar — owner contact details are kept private.
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t border-navy-800 text-xs text-gray-500 font-sans flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
          <p>© {new Date().getFullYear()} Aadana Tharakar. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> in Tamil Nadu
          </p>
          <p>
            Developed by{" "}
            <a href="https://rturox.com/" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 transition-colors font-medium">
              Rturox
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
