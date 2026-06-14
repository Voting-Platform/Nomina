"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Input,
  CopyButton,
  Separator,
  ConfirmDialog,
  VoterAccessForm,
  VoterListManager,
  InvitationComposer,
} from "@/components";
import {
  generateElectionLink,
  updateAccessSettings,
  regeneratePin,
  getVoters,
} from "@/lib/api/server";
import { KeyRound, Link2, RefreshCw, Settings2 } from "lucide-react";
import type { ElectionDetailData, VoterAccessInput } from "@/types";

interface ShareManagerProps {
  electionId: string;
  election: ElectionDetailData;
}

export function ShareManager({ electionId, election }: ShareManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState(election.electionLink || "");
  const [pin, setPin] = useState<string | null>(election.pin);
  const [confirmRegenPin, setConfirmRegenPin] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  const [access, setAccess] = useState<VoterAccessInput>({
    accessType: election.accessType,
    pinEnabled: election.pinEnabled,
    otpRequired: election.otpRequired,
    collectVoterDetails: election.collectVoterDetails,
    revealVoterIdentities: election.revealVoterIdentities,
    voters: [],
  });

  const isProtected = access.accessType === "protected";

  // Voter roster (drives the invitation composer counts)
  const { data: voters = [] } = useQuery({
    queryKey: ["voters", electionId],
    queryFn: () => getVoters(electionId),
    enabled: isProtected,
  });
  const pendingCount = voters.filter(
    (v) => !v.exhaustedAt && v.invitationStatus !== "sent"
  ).length;

  const handleRegenerateLink = () => {
    startTransition(async () => {
      const result = await generateElectionLink(electionId);
      setLink(result.link);
    });
  };

  const handleSaveAccess = async () => {
    setSavingAccess(true);
    try {
      const result = await updateAccessSettings(electionId, {
        accessType: access.accessType,
        pinEnabled: access.pinEnabled,
        otpRequired: access.otpRequired,
        collectVoterDetails: access.collectVoterDetails,
        revealVoterIdentities: access.revealVoterIdentities,
      });
      setPin(result.pin);
      toast.success("Access settings saved");
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save access settings"
      );
    } finally {
      setSavingAccess(false);
    }
  };

  const handleRegeneratePin = async () => {
    setConfirmRegenPin(false);
    try {
      const result = await regeneratePin(electionId);
      setPin(result.pin);
      toast.success("New PIN generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not regenerate PIN");
    }
  };

  return (
    <div className="space-y-6">
      {/* Election link */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Election Link
          </h3>
        </div>
        {isProtected ? (
          <p className="text-xs text-[var(--text-muted)]">
            This is a protected election — voters access it through the unique
            links emailed to them, not this shared link. Visiting it without an
            invitation shows an &quot;invitation required&quot; page.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Share this link with your voters
            {access.pinEnabled ? " along with the election PIN below" : ""}.
          </p>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={link}
            readOnly
            className="flex-1 bg-[var(--background)] text-[var(--text-secondary)] select-all font-mono text-xs"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <CopyButton value={link} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateLink}
          disabled={isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      {/* PIN card (public + PIN) */}
      {!isProtected && access.pinEnabled && pin && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Election PIN
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Voters must enter this PIN after opening the election link. Share
            it together with the link.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {pin.split("").map((digit, i) => (
                <span
                  key={i}
                  className="flex h-11 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-lg font-bold text-[var(--text-primary)] tabular-nums"
                >
                  {digit}
                </span>
              ))}
            </div>
            <CopyButton value={pin} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRegenPin(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate PIN
          </Button>
          <ConfirmDialog
            open={confirmRegenPin}
            onOpenChange={setConfirmRegenPin}
            title="Regenerate election PIN?"
            description="The current PIN will stop working immediately. Voters who already passed the PIN keep access until their session expires (about 2 hours). You'll need to share the new PIN."
            confirmLabel="Regenerate"
            onConfirm={handleRegeneratePin}
          />
        </div>
      )}

      <Separator />

      {/* Access settings */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Voter Access Settings
          </h3>
        </div>
        <VoterAccessForm
          value={access}
          onChange={setAccess}
          showVoterEntry={false}
          lockAccessType={election.totalVotes > 0}
        />
        <Button onClick={handleSaveAccess} disabled={savingAccess}>
          {savingAccess ? "Saving..." : "Save access settings"}
        </Button>
      </div>

      {/* Protected: voter roster + invitations */}
      {isProtected && (
        <>
          <Separator />
          <VoterListManager electionId={electionId} />
          <InvitationComposer
            electionId={electionId}
            initialTemplate={
              election.emailTemplate ?? {
                preset: "formal",
                subject: "",
                message: "",
              }
            }
            pendingCount={pendingCount}
            totalVoters={voters.length}
          />
        </>
      )}
    </div>
  );
}
