"use client";

import { ErrorPanel } from "@/components/support/ErrorPanel";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} reset={reset} homeHref="/dashboard" homeLabel="Go to overview" />;
}
