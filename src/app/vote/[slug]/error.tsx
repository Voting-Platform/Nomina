"use client";

import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function VoteError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] mb-6">
        <TriangleAlert className="h-8 w-8 text-[var(--destructive)]" />
      </div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
        We couldn&apos;t load this election. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
