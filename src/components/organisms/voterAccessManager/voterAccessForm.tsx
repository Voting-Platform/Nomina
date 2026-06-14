"use client";

import { useState } from "react";
import { Globe, KeyRound, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { Label, Switch, Textarea, Button, VoterFileUpload } from "@/components";
import type { AccessType, VoterAccessInput, VoterEntry } from "@/types";

interface VoterAccessFormProps {
  value: VoterAccessInput;
  onChange: (value: VoterAccessInput) => void;
  /** Show the voter roster entry section (wizard). The Share tab manages voters separately. */
  showVoterEntry?: boolean;
  /** Prevent switching access type (votes already exist). */
  lockAccessType?: boolean;
  errors?: Record<string, string>;
}

const ACCESS_OPTIONS: {
  value: AccessType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "public",
    label: "Public election",
    description:
      "Anyone with the link can vote. Optionally protect access with a PIN.",
    icon: Globe,
  },
  {
    value: "protected",
    label: "Protected election",
    description:
      "Only invited voters can vote, each through a unique emailed link.",
    icon: ShieldCheck,
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VoterAccessForm({
  value,
  onChange,
  showVoterEntry = true,
  lockAccessType = false,
  errors,
}: VoterAccessFormProps) {
  const [manualEmails, setManualEmails] = useState("");

  const set = (patch: Partial<VoterAccessInput>) =>
    onChange({ ...value, ...patch });

  const addManualEmails = () => {
    const entries: VoterEntry[] = manualEmails
      .split(/[,\n;]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => EMAIL_REGEX.test(s))
      .map((email) => ({ email }));
    if (entries.length === 0) return;
    mergeVoters(entries);
    setManualEmails("");
  };

  const mergeVoters = (entries: VoterEntry[]) => {
    const seen = new Set(value.voters.map((v) => v.email));
    const merged = [...value.voters];
    for (const e of entries) {
      if (!seen.has(e.email)) {
        seen.add(e.email);
        merged.push(e);
      }
    }
    set({ voters: merged });
  };

  const removeVoterAt = (index: number) => {
    set({ voters: value.voters.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {errors?.voterAccess && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.voterAccess}
        </p>
      )}

      {/* Access type selector */}
      <div className="space-y-3">
        {ACCESS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value.accessType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={lockAccessType && !isSelected}
              onClick={() => set({ accessType: option.value })}
              className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]/50 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                  ${isSelected ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
        {lockAccessType && (
          <p className="text-xs text-[var(--text-muted)]">
            The access type can&apos;t be changed after votes have been cast.
          </p>
        )}
      </div>

      {/* Public: PIN option */}
      {value.accessType === "public" && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="space-y-1">
            <Label htmlFor="pin-enabled" className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              Require an election PIN
            </Label>
            <p className="text-xs text-[var(--text-muted)]">
              Voters must enter a 6-digit PIN before accessing the ballot. The
              PIN is generated automatically — find and share it from the Share
              tab.
            </p>
          </div>
          <Switch
            id="pin-enabled"
            checked={value.pinEnabled}
            onCheckedChange={(checked) => set({ pinEnabled: checked as boolean })}
          />
        </div>
      )}

      {/* Protected: voters + OTP */}
      {value.accessType === "protected" && (
        <div className="space-y-4">
          {showVoterEntry && (
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div>
                <Label htmlFor="manual-emails" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  Voter emails
                </Label>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Each voter receives a unique voting link by email. Add emails
                  manually or upload a spreadsheet.
                </p>
              </div>

              <div className="flex gap-2">
                <Textarea
                  id="manual-emails"
                  placeholder={"john@example.com\njane@example.com"}
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addManualEmails}
                disabled={!manualEmails.trim()}
              >
                Add emails
              </Button>

              <VoterFileUpload onEntriesParsed={mergeVoters} />

              {value.voters.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {value.voters.length} voter(s)
                  </p>
                  {value.voters.map((voter, i) => (
                    <div
                      key={voter.email}
                      className="flex items-center justify-between gap-2 rounded-lg bg-[var(--background)] px-3 py-1.5"
                    >
                      <span className="text-xs text-[var(--text-primary)] truncate">
                        {voter.email}
                        {voter.name && (
                          <span className="text-[var(--text-muted)]"> — {voter.name}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVoterAt(i)}
                        aria-label={`Remove ${voter.email}`}
                        className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="space-y-1">
              <Label htmlFor="otp-required" className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                Require email OTP verification
              </Label>
              <p className="text-xs text-[var(--text-muted)]">
                When voters open their link, a one-time code is emailed to them
                and must be entered before voting. Adds a second layer of
                identity verification.
              </p>
            </div>
            <Switch
              id="otp-required"
              checked={value.otpRequired}
              onCheckedChange={(checked) => set({ otpRequired: checked as boolean })}
            />
          </div>
        </div>
      )}

      {/* Privacy settings — independent of access type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Voter privacy
        </p>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="space-y-1">
            <Label htmlFor="collect-details">Collect voter details</Label>
            <p className="text-xs text-[var(--text-muted)]">
              Voters must provide their name and email before voting.
            </p>
          </div>
          <Switch
            id="collect-details"
            checked={value.collectVoterDetails}
            onCheckedChange={(checked) =>
              set({ collectVoterDetails: checked as boolean })
            }
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="space-y-1">
            <Label htmlFor="reveal-identities">Reveal voter identities</Label>
            <p className="text-xs text-[var(--text-muted)]">
              You (the organizer) can see who voted for whom in the Results tab
              and CSV export. Identities are never shown to voters or the
              public.
            </p>
            {value.revealVoterIdentities && (
              <p className="text-xs text-[var(--warning)] mt-1">
                ⚠️ Voters should be informed their votes are not anonymous
              </p>
            )}
          </div>
          <Switch
            id="reveal-identities"
            checked={value.revealVoterIdentities}
            onCheckedChange={(checked) =>
              set({ revealVoterIdentities: checked as boolean })
            }
          />
        </div>
      </div>
    </div>
  );
}
