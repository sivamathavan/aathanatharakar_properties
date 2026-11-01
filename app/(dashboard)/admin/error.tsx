"use client";

import { ErrorPanel } from "@/components/support/ErrorPanel";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} reset={reset} homeHref="/admin" homeLabel="Go to overview" />;
}
