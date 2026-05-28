import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-warm-cream px-4 pb-24 md:pb-0">
      <div className="max-w-md text-center">
        <p className="text-gold-700 font-bold text-xs uppercase tracking-widest mb-3">
          Error 404
        </p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-navy-900 mb-3">
          Page not found
        </h1>
        <p className="text-sm text-navy-700 mb-8 leading-relaxed">
          The page you're looking for has moved, expired, or never existed.
          Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 h-11 px-6 font-bold rounded-btn shadow-sm">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
          <Link href="/properties">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-navy-700 text-navy-800 hover:bg-navy-50 h-11 px-6 font-bold rounded-btn"
            >
              <Search className="w-4 h-4 mr-2" /> Browse Properties
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
