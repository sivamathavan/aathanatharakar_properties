"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Detect if the device is an iPhone/iPad
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // 2. Check if the app is already installed/running in "standalone" (PWA) mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (navigator as any).standalone;
    
    // 3. Only show the prompt to iOS users who haven't installed it yet
    if (isIOS && !isStandalone) {
      const hasDismissed = localStorage.getItem("ios-prompt-dismissed");
      if (!hasDismissed) {
        // Delay slightly for smoother entrance after page load
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("ios-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 xs:bottom-24 left-4 right-4 z-50 max-w-sm sm:mx-auto bg-white/95 backdrop-blur-md text-navy-900 p-4 rounded-2xl shadow-[0_10px_30px_rgba(13,27,42,0.15)] border-t-4 border-t-gold-500 border border-gold-200/50 flex flex-col gap-3 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 bg-gradient-to-tr from-navy-900 to-navy-800 rounded-xl flex items-center justify-center text-gold-500 font-bold text-xl shadow-md border border-gold-400/20">
            ஆ
          </div>
          <div>
            <h4 className="font-semibold text-sm text-navy-950 font-sans tracking-wide">
              Install Aadana Tharakar
            </h4>
            <p className="text-[10px] text-navy-600 font-tamil leading-normal">
              முகப்புத் திரையில் சேர்த்து எளிதாகப் பயன்படுத்துங்கள்!
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="p-1 rounded-full text-navy-400 hover:text-navy-900 hover:bg-navy-50 transition-colors"
          aria-label="Close install prompt"
        >
          <X size={18} />
        </button>
      </div>

      {/* Instructions */}
      <div className="text-xs border-t border-cream-200 pt-3 flex flex-wrap items-center gap-1.5 leading-relaxed text-navy-800 font-sans">
        <span>Tap the share button</span>
        <span className="inline-flex items-center justify-center p-1 bg-cream-100 border border-gold-200 rounded-lg shadow-sm">
          <Share size={14} className="text-[#007AFF] fill-current" />
        </span>
        <span>below, then scroll down and select</span>
        <span className="font-bold text-navy-950 underline decoration-gold-500 decoration-2">
          "Add to Home Screen"
        </span>
        <span className="text-navy-500 text-[10px] block w-full mt-0.5 font-tamil">
          கீழே உள்ள பகிர்வு பொத்தானை அழுத்தி, "முகப்புத் திரையில் சேர்" என்பதைத் தேர்ந்தெடுக்கவும்.
        </span>
      </div>
    </div>
  );
}
