import { cache } from "react";
import { getAgentBySlug } from "@/lib/firestore";
import { isPlanLive } from "@/lib/plans";
import type { AgentDoc } from "@/types";

/** The agent behind a share link, and whether their page may be shown. */
export const loadPublicAgent = cache(async (slug: string): Promise<{ agent: AgentDoc | null; live: boolean }> => {
  const agent = await getAgentBySlug(slug);
  if (!agent) return { agent: null, live: false };
  return { agent, live: isPlanLive(agent.plan) && agent.emailVerified };
});
