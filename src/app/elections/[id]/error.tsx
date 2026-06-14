"use client";

import { PageError } from "@/components/atoms/pageError";

export default function ElectionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} />;
}
