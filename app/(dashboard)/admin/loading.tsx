import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-navy-500">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        <p className="text-sm font-medium animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  );
}
