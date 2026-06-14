"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button, PinInput } from "@/components";
import { requestVoterOtp, verifyVoterOtp } from "@/lib/api/server";

interface OtpGateProps {
  slug: string;
  electionTitle: string;
  token: string;
  maskedEmail: string;
}

export function OtpGate({ slug, electionTitle, token, maskedEmail }: OtpGateProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSend = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setError(null);
    const result = await requestVoterOtp(slug, token);
    if (result.ok) {
      setSent(true);
      setCooldown(60);
    } else {
      setError(result.error ?? "Could not send the code.");
      if (result.retryAfterMs) {
        setCooldown(Math.ceil(result.retryAfterMs / 1000));
      }
    }
    setSending(false);
  };

  const handleVerify = async (value: string) => {
    if (verifying || value.length !== 6) return;
    setVerifying(true);
    setError(null);
    const result = await verifyVoterOtp(slug, token, value);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.error ?? "Incorrect code");
    setCode("");
    setVerifying(false);
  };

  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10 mb-5">
        <MailCheck className="h-6 w-6 text-[var(--primary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
        {electionTitle}
      </p>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Verify it&apos;s you
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm">
        {sent ? (
          <>
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {maskedEmail}
            </span>
            . Enter it below to access your ballot.
          </>
        ) : (
          <>
            For security, we&apos;ll send a one-time code to your email{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {maskedEmail}
            </span>
            .
          </>
        )}
      </p>

      {sent ? (
        <>
          <PinInput
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            disabled={verifying}
          />
          {error && (
            <p className="text-sm text-[var(--destructive)] mt-4">{error}</p>
          )}
          <Button
            className="mt-8 w-full max-w-xs"
            disabled={code.length !== 6 || verifying}
            onClick={() => handleVerify(code)}
          >
            {verifying ? "Verifying..." : "Verify & continue"}
          </Button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || cooldown > 0}
            className="mt-4 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-50 transition-colors"
          >
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : sending
                ? "Sending..."
                : "Didn't get it? Resend code"}
          </button>
        </>
      ) : (
        <>
          {error && (
            <p className="text-sm text-[var(--destructive)] mb-4">{error}</p>
          )}
          <Button
            className="w-full max-w-xs"
            disabled={sending || cooldown > 0}
            onClick={handleSend}
          >
            {sending
              ? "Sending..."
              : cooldown > 0
                ? `Try again in ${cooldown}s`
                : "Send code to my email"}
          </Button>
        </>
      )}
    </div>
  );
}
