import Link from "next/link";
import { TN_CITIES } from "@/lib/constants";
import { Heart } from "lucide-react";

import { LogoIcon } from "@/components/brand/LogoIcon";

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white border-t border-navy-800">
      {/* Tablet & Desktop Layout */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        
        {/* Full-width logo for tablet+ */}
        <div className="hidden md:block pb-8 border-b border-navy-800 mb-10">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <LogoIcon className="w-8 h-8" />
                <span className="font-tamil font-bold text-2xl text-white tracking-wide">
                  Aadana<span className="text-gold-500">Tharakar</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 pl-10">Find Your Dream Property in Tamil Nadu</p>
            </div>
            <div className="flex gap-4">
              {/* Custom SVG Facebook */}
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              {/* Custom SVG Twitter / X */}
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Custom SVG Instagram */}
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* Custom SVG LinkedIn */}
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 font-sans">
          
          {/* Mobile top stacked section */}
          <div className="md:hidden space-y-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <LogoIcon className="w-6 h-6" />
              <span className="font-tamil font-bold text-xl text-white tracking-wide">
                Aadana<span className="text-gold-500">Tharakar</span>
              </span>
            </div>
            <p className="text-xs text-gray-400">
              உங்கள் கனவு சொத்தை கண்டுபிடியுங்கள் — Find Your Dream Property in Tamil Nadu.
            </p>
            <div className="flex gap-4 justify-center pt-2">
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-navy-800 text-gray-400 hover:text-gold-500 rounded-full flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="border-t border-navy-800 pt-6 mt-6 md:border-t-0 md:pt-0 md:mt-0">
            <h4 className="font-display font-semibold text-gold-500 text-sm md:text-base mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-400">
              <li><Link href="/properties" className="hover:text-gold-500 transition-colors">Properties</Link></li>
              <li><Link href="/services" className="hover:text-gold-500 transition-colors">Allied Services</Link></li>
              <li><Link href="/blog" className="hover:text-gold-500 transition-colors">Blog</Link></li>
              <li><Link href="/about" className="hover:text-gold-500 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Top Cities (For SEO) */}
          <div className="border-t border-navy-800 pt-6 mt-6 md:border-t-0 md:pt-0 md:mt-0">
            <h4 className="font-display font-semibold text-gold-500 text-sm md:text-base mb-4 uppercase tracking-wider">Top Cities</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm text-gray-400">
              {TN_CITIES.slice(0, 4).map(city => (
                <li key={city}>
                  <Link href={`/properties?city=${city}`} className="hover:text-gold-500 transition-colors">{city}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="border-t border-navy-800 pt-6 mt-6 md:border-t-0 md:pt-0 md:mt-0">
            <h4 className="font-display font-semibold text-gold-500 text-sm md:text-base mb-4 uppercase tracking-wider">Contact Us</h4>
            <div className="text-sm text-gray-400 space-y-3">
              <p className="leading-relaxed">
                <strong className="text-gray-200 block mb-1">Tamilarasan (Founder)</strong>
                Vadavalli, Coimbatore - 641041<br/>
                Tamil Nadu
              </p>
              <p className="leading-relaxed">
                <a href="tel:+916382987874" className="hover:text-gold-500 transition-colors block">📞 +91 63829 87874</a>
                <a href="tel:+916381169124" className="hover:text-gold-500 transition-colors block">📞 +91 63811 69124</a>
              </p>
              <p className="leading-relaxed">
                <a href="mailto:aadanatharakarproperty@gmail.com" className="hover:text-gold-500 transition-colors break-all">
                  ✉️ aadanatharakarproperty@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-navy-800 text-center text-xs text-gray-500 font-sans flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold-500 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold-500 transition-colors">Terms of Service</Link>
          </div>
          <p>© {new Date().getFullYear()} Aadana Tharakar. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> in Tamil Nadu
          </p>
        </div>
      </div>
    </footer>
  );
}
