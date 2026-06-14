"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button, PinInput } from "@/components";
import { verifyElectionPin } from "@/lib/api/server";

interface PinGateProps {
  slug: string;
  electionTitle: string;
}

export function PinGate({ slug, electionTitle }: PinGateProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (value: string) => {
    if (submitting || value.length !== 6) return;
    setSubmitting(true);
    setError(null);
    const result = await verifyElectionPin(slug, value);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.error ?? "Incorrect PIN");
    setRetryAfterMs(result.retryAfterMs ?? null);
    setPin("");
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10 mb-5">
        <KeyRound className="h-6 w-6 text-[var(--primary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
        {electionTitle}
      </p>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Enter the election PIN
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm">
        This election is protected with a PIN. Enter the 6-digit PIN shared by
        the organizer to continue.
      </p>

      <PinInput
        value={pin}
        onChange={setPin}
        onComplete={handleSubmit}
        disabled={submitting}
      />

      {error && (
        <p className="text-sm text-[var(--destructive)] mt-4">
          {error}
          {retryAfterMs != null && retryAfterMs > 0 && (
            <> Try again in {Math.ceil(retryAfterMs / 60000)} min.</>
          )}
        </p>
      )}

      <Button
        className="mt-8 w-full max-w-xs"
        disabled={pin.length !== 6 || submitting}
        onClick={() => handleSubmit(pin)}
      >
        {submitting ? "Verifying..." : "Continue"}
      </Button>
    </div>
  );
}
