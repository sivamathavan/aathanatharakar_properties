import { cache } from "react";
import { getAgentById, getPropertyById } from "@/lib/firestore";
import { getServerUser } from "@/lib/auth";
import { isPlanLive } from "@/lib/plans";
import { PropertyStatus, UserRole, type AgentDoc, type PropertyDoc } from "@/types";

/**
 * A listing's main-site page (/properties/[id]) and the agent behind it, or null
 * when the page must be a 404. Cached per request, so the layout's check, the
 * metadata and the page share one read.
 */
export const loadListing = cache(async (id: string): Promise<{ property: PropertyDoc; agent: AgentDoc | null } | null> => {
  const property = await getPropertyById(id);
  if (!property) return null;

  // Sold, rented or hidden listings stay visible to their owner and the admin only.
  if (property.status !== PropertyStatus.ACTIVE) {
    const session = await getServerUser();
    if (!session || (session.role !== UserRole.ADMIN && session.uid !== property.postedById)) return null;
  }

  // Agent listings on the main site are boosted ones; calls go to the agent.
  if (property.ownerType !== "AGENT") return { property, agent: null };
  const agent = await getAgentById(property.postedById);
  return agent && isPlanLive(agent.plan) ? { property, agent } : null;
});
