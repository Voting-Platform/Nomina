"use client";

import { PageError } from "@/components/atoms/pageError";

export default function CreateElectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} />;
}
