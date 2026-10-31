import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getAgentById, getPlansConfig } from "@/lib/firestore";
import { UserRole } from "@/types";

/** For agent dashboard pages: the signed-in agent, their profile and the plan table. */
export async function requireAgentPage() {
  const session = await getServerUser();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role === UserRole.ADMIN) redirect("/admin");
  const [agent, plans] = await Promise.all([getAgentById(session.uid), getPlansConfig()]);
  if (!agent) redirect("/register");
  return { session, agent, plans, limits: plans.plans[agent.plan.id] };
}
