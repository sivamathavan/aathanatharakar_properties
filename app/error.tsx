"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-warm-cream px-4 pb-24 md:pb-0">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 mx-auto bg-gold-500/15 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-gold-700" />
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-900 mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-navy-700 mb-8 leading-relaxed">
          We hit an unexpected error. You can try again, or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 h-11 px-6 font-bold rounded-btn shadow-sm"
          >
            Try again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-navy-700 text-navy-800 hover:bg-navy-50 h-11 px-6 font-bold rounded-btn"
            >
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
