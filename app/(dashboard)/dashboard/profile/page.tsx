import { requireAgentPage } from "@/lib/agent-session";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata = { title: "Profile | DK Promoters" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { agent, limits } = await requireAgentPage();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Profile</h1>
        <p className="text-sm text-navy-700">This is what clients see at the top of your page.</p>
      </div>
      <ProfileForm agent={JSON.parse(JSON.stringify(agent))} canBrand={limits.branding} />
    </div>
  );
}
