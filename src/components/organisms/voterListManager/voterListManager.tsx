"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Mail, MailWarning, Plus, Send, Trash2, UserRound } from "lucide-react";
import { Button, Textarea, Badge, ConfirmDialog, VoterFileUpload } from "@/components";
import { getVoters, addVoters, removeVoter, sendInvitations } from "@/lib/api/server";
import type { VoterEntry, VoterTokenDocument } from "@/types";

interface VoterListManagerProps {
  electionId: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function statusBadge(voter: VoterTokenDocument) {
  if (voter.exhaustedAt) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> Voted
      </Badge>
    );
  }
  switch (voter.invitationStatus) {
    case "sent":
      return (
        <Badge variant="info" className="gap-1">
          <Mail className="h-3 w-3" /> Invited
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="warning" className="gap-1">
          <MailWarning className="h-3 w-3" /> Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export function VoterListManager({ electionId }: VoterListManagerProps) {
  const queryClient = useQueryClient();
  const [manualEmails, setManualEmails] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<VoterTokenDocument | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: voters = [], isLoading } = useQuery({
    queryKey: ["voters", electionId],
    queryFn: () => getVoters(electionId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["voters", electionId] });

  const addMutation = useMutation({
    mutationFn: (entries: VoterEntry[]) => addVoters(electionId, entries),
    onSuccess: (result) => {
      toast.success(
        `${result.added} voter(s) added${result.skippedDuplicates > 0 ? `, ${result.skippedDuplicates} duplicate(s) skipped` : ""}`
      );
      setManualEmails("");
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not add voters"),
  });

  const removeMutation = useMutation({
    mutationFn: (voterId: string) => removeVoter(electionId, voterId),
    onSuccess: () => {
      toast.success("Voter removed");
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not remove voter"),
  });

  const handleAddManual = () => {
    const entries: VoterEntry[] = manualEmails
      .split(/[,\n;]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => EMAIL_REGEX.test(s))
      .map((email) => ({ email }));
    if (entries.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }
    addMutation.mutate(entries);
  };

  const handleResend = async (voter: VoterTokenDocument) => {
    setResendingId(voter._id);
    try {
      const result = await sendInvitations(electionId, { voterIds: [voter._id] });
      if (!result.success) {
        toast.error(result.error ?? "Could not send the invitation");
      } else if (result.failed.length > 0) {
        toast.error(`Sending to ${voter.email} failed`);
      } else {
        toast.success(`Invitation sent to ${voter.email}`);
      }
      invalidate();
    } finally {
      setResendingId(null);
    }
  };

  const votedCount = voters.filter((v) => v.exhaustedAt).length;
  const invitedCount = voters.filter((v) => v.invitationStatus === "sent").length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[var(--primary)]" />
            Voter list
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {voters.length} voter(s) · {invitedCount} invited · {votedCount} voted
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAdd((p) => !p)}>
          <Plus className="h-4 w-4" />
          Add voters
        </Button>
      </div>

      {showAdd && (
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <Textarea
            placeholder={"Add emails — one per line or comma-separated\njohn@example.com, jane@example.com"}
            value={manualEmails}
            onChange={(e) => setManualEmails(e.target.value)}
            rows={3}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAddManual}
              disabled={addMutation.isPending || !manualEmails.trim()}
            >
              {addMutation.isPending ? "Adding..." : "Add emails"}
            </Button>
          </div>
          <VoterFileUpload
            onEntriesParsed={(entries) => addMutation.mutate(entries)}
            disabled={addMutation.isPending}
          />
        </div>
      )}

      {/* Roster */}
      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)] py-4 text-center">
          Loading voters...
        </p>
      ) : voters.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4 text-center">
          No voters yet. Add emails or upload a spreadsheet to build your voter
          list.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {voters.map((voter) => (
            <div
              key={voter._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {voter.email}
                </p>
                {voter.name && (
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {voter.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(voter)}
                {!voter.exhaustedAt && (
                  <>
                    <button
                      type="button"
                      title={
                        voter.invitationStatus === "sent"
                          ? "Resend invitation (generates a new link; the old one stops working)"
                          : "Send invitation"
                      }
                      disabled={resendingId === voter._id}
                      onClick={() => handleResend(voter)}
                      className="text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-40 transition-colors"
                    >
                      <Send className={`h-3.5 w-3.5 ${resendingId === voter._id ? "animate-pulse" : ""}`} />
                    </button>
                    <button
                      type="button"
                      title="Remove voter"
                      onClick={() => setRemoveTarget(voter)}
                      className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove voter?"
        description={`${removeTarget?.email ?? ""} will no longer be able to vote. Their invitation link (if sent) will stop working.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget._id);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}
