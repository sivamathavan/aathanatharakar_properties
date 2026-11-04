import { BRAND } from "@/lib/brand";
import { GetAppPanel } from "@/components/app/GetAppPanel";

export const metadata = {
  title: "Get the app",
  description: `Put ${BRAND.name} on your phone: the Android app, or Add to Home Screen on iPhone.`,
};

export default function GetAppPage() {
  return (
    <div className="bg-warm-cream">
      <div className="container mx-auto px-4 max-w-2xl py-10 md:py-14 space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900">{BRAND.name} app-ah phone-la podunga</h1>
          <p className="text-sm text-navy-700">Phone-la oru icon irundhaa, daily open panna easy. Adhu idhe website dhaan, adhe login.</p>
        </div>
        <GetAppPanel />
      </div>
    </div>
  );
}
