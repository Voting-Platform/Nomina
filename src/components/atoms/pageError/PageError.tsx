"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function PageError({ error, reset }: PageErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--destructive-light)]">
        <AlertTriangle className="h-7 w-7 text-[var(--destructive)]" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
