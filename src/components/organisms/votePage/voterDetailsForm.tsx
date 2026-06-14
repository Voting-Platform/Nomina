"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Button, Input, Label } from "@/components";
import { submitVoterDetails } from "@/lib/api/server";

interface VoterDetailsFormProps {
  slug: string;
  electionTitle: string;
  /** Personalized-link token (protected elections). */
  token?: string;
  prefillName?: string;
  prefillEmail?: string;
}

export function VoterDetailsForm({
  slug,
  electionTitle,
  token,
  prefillName = "",
  prefillEmail = "",
}: VoterDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await submitVoterDetails(slug, { name, email }, token);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.error ?? "Something went wrong. Please try again.");
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10 mb-5">
        <UserRound className="h-6 w-6 text-[var(--primary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
        {electionTitle}
      </p>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Your details
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm">
        The organizer of this election requires voters to provide their name
        and email before voting.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="voter-name">Full name</Label>
          <Input
            id="voter-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="voter-email">Email address</Label>
          <Input
            id="voter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            maxLength={254}
            required
          />
        </div>

        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !name.trim() || !email.trim()}
        >
          {submitting ? "Saving..." : "Continue to ballot"}
        </Button>
      </form>
    </div>
  );
}
