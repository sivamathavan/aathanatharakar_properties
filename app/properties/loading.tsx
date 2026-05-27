import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-warm-cream">
      <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
      <h2 className="text-navy-900 font-display font-semibold text-lg">Loading Properties...</h2>
      <p className="text-navy-600 font-sans text-sm">Please wait while we fetch the latest listings.</p>
    </div>
  );
}
