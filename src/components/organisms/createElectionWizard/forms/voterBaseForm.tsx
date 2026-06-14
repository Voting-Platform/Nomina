"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Globe, Mail, AtSign, Upload, Trash2 } from "lucide-react";
import type { VoterBaseInput, VoterBaseMode } from "@/types/election";

interface VoterBaseFormProps {
  voterBase: VoterBaseInput;
  onVoterBaseChange: (voterBase: VoterBaseInput) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

const MODE_OPTIONS: { value: VoterBaseMode; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "anyone_with_link",
    label: "Anyone with link",
    description: "Anyone who has the election link can vote",
    icon: Globe,
  },
  {
    value: "restricted_emails",
    label: "Restricted to specific emails",
    description: "Only specified email addresses can vote",
    icon: Mail,
  },
  {
    value: "restricted_domain",
    label: "Restricted to email domain",
    description: "Only emails from a specific domain can vote",
    icon: AtSign,
  },
];

export function VoterBaseForm({ voterBase, onVoterBaseChange, errors, disabled }: VoterBaseFormProps) {
  const [rawEmails, setRawEmails] = useState(() => (voterBase.emails || []).join("\n"));
  const [importError, setImportError] = useState<string | null>(null);

  // Sync parent emails to local state if they changed outside (e.g. initial load, reset, or file upload)
  useEffect(() => {
    const parentJoined = (voterBase.emails || []).join("\n");
    const localParsedJoined = rawEmails
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n");
    if (parentJoined !== localParsedJoined) {
      setRawEmails(parentJoined);
    }
  }, [voterBase.emails]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawEmails(val);

    const parsedEmails = val
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const currentEmailsJoined = (voterBase.emails || []).join(",");
    const parsedEmailsJoined = parsedEmails.join(",");
    if (currentEmailsJoined !== parsedEmailsJoined) {
      onVoterBaseChange({
        ...voterBase,
        emails: parsedEmails,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportError("The file appears to be empty.");
        return;
      }

      // Regex matching standard email address structure
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailRegex) || [];
      const extractedEmails = matches.map((email) => email.trim().toLowerCase());

      if (extractedEmails.length === 0) {
        setImportError("No valid email addresses were found in the uploaded file.");
        return;
      }

      const currentEmails = voterBase.emails || [];
      // Combine existing with newly extracted, deduplicate
      const mergedEmails = Array.from(new Set([...currentEmails, ...extractedEmails]));

      onVoterBaseChange({
        ...voterBase,
        emails: mergedEmails,
      });

      // Clear the input file selection
      e.target.value = "";
    };

    reader.onerror = () => {
      setImportError("Failed to read the selected file.");
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {errors?.voterBase && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.voterBase}
        </p>
      )}
      {/* Mode selector */}
      <div className="space-y-3">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = voterBase.mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onVoterBaseChange({ ...voterBase, mode: option.value })
              }
              className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]/50 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
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
      </div>

      {/* Restricted emails input */}
      {voterBase.mode === "restricted_emails" && (
        <div className="space-y-3 pt-2">
          <Label htmlFor="voter-emails">Voter Email Addresses</Label>
          <Textarea
            id="voter-emails"
            placeholder="Enter email addresses, one per line or comma-separated&#10;john@example.com&#10;jane@example.com"
            value={rawEmails}
            onChange={handleTextareaChange}
            disabled={disabled}
            rows={5}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="file"
                id="email-file-upload"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={disabled}
              />
              <Label
                htmlFor="email-file-upload"
                className={`flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-hover)] p-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:bg-[var(--background)] hover:border-[var(--primary)] transition-all duration-200 ${
                  disabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <Upload className="h-4 w-4 text-[var(--primary)]" />
                Upload CSV / TXT
              </Label>
            </div>
            {(voterBase.emails || []).length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onVoterBaseChange({
                    ...voterBase,
                    emails: [],
                  });
                  setRawEmails("");
                  setImportError(null);
                }}
                disabled={disabled}
                className="border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive-light)]/20 hover:text-[var(--destructive)]"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
          {importError && (
            <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)]/50 px-3 py-2 rounded-lg mt-1 animate-in fade-in duration-200">
              ⚠️ {importError}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            {(voterBase.emails || []).length} email(s) added
          </p>
        </div>
      )}

      {/* Restricted domain input */}
      {voterBase.mode === "restricted_domain" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="voter-domain">Allowed Email Domain</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">@</span>
            <Input
              id="voter-domain"
              placeholder="e.g. moratuwa.ac.lk"
              value={(voterBase.domains || [])[0] || ""}
              onChange={(e) =>
                onVoterBaseChange({
                  ...voterBase,
                  domains: [e.target.value.trim()].filter(Boolean),
                })
              }
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Only users with this email domain will be able to vote
          </p>
        </div>
      )}
    </div>
  );
}
