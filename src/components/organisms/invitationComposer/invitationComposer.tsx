"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Mail, Send } from "lucide-react";
import { Button, Input, Label, Textarea, Progress } from "@/components";
import {
  sendInvitations,
  updateEmailTemplate,
  previewInvitationEmail,
} from "@/lib/api/server";
import type { EmailTemplatePreset, EmailTemplateSettings } from "@/types";

interface InvitationComposerProps {
  electionId: string;
  initialTemplate: EmailTemplateSettings;
  /** Voters with invitationStatus pending/failed (drives the send button). */
  pendingCount: number;
  totalVoters: number;
}

const PRESETS: { value: EmailTemplatePreset; label: string; description: string }[] = [
  { value: "formal", label: "Formal", description: "Professional, official tone" },
  { value: "casual", label: "Casual", description: "Friendly and colorful" },
  { value: "minimal", label: "Minimal", description: "Plain and to the point" },
];

const GMAIL_WARNING_THRESHOLD = 400;

export function InvitationComposer({
  electionId,
  initialTemplate,
  pendingCount,
  totalVoters,
}: InvitationComposerProps) {
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState<EmailTemplateSettings>(initialTemplate);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live preview — same renderer the real emails use
  useEffect(() => {
    if (!showPreview) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      try {
        const result = await previewInvitationEmail(electionId, template);
        setPreviewHtml(result.html);
        setPreviewSubject(result.subject);
      } catch {
        // Keep the previous preview on transient failures
      }
    }, 400);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [template, showPreview, electionId]);

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await updateEmailTemplate(electionId, template);
      toast.success("Email template saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the template");
    } finally {
      setSaving(false);
    }
  };

  const handleSendAll = async () => {
    setSending(true);
    setProgress({ sent: 0, failed: 0 });
    try {
      // Persist the template first so the batch uses exactly what's on screen
      await updateEmailTemplate(electionId, template);

      let sent = 0;
      let failed = 0;
      // The server caps each call at 25 — keep calling until none remain
      for (let guard = 0; guard < 100; guard++) {
        const result = await sendInvitations(electionId);
        if (!result.success) {
          toast.error(result.error ?? "Sending failed");
          break;
        }
        sent += result.sent;
        failed += result.failed.length;
        setProgress({ sent, failed });
        if (result.remaining === 0) break;
      }

      if (sent > 0) toast.success(`${sent} invitation(s) sent`);
      if (failed > 0) toast.error(`${failed} invitation(s) failed — retry from the voter list`);
      queryClient.invalidateQueries({ queryKey: ["voters", electionId] });
    } finally {
      setSending(false);
    }
  };

  const totalToSend = progress ? progress.sent + progress.failed : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--primary)]" />
          Invitation email
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Each voter receives this email with their unique voting link.
        </p>
      </div>

      {/* Preset picker */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const isSelected = template.preset === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => setTemplate({ ...template, preset: preset.value })}
              className={`rounded-xl border p-3 text-left transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]/50 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]"
                }`}
            >
              <p className={`text-xs font-semibold ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                {preset.label}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Subject + message */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email-subject">Subject</Label>
          <Input
            id="email-subject"
            placeholder="Leave empty to use the template default"
            value={template.subject}
            onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email-message">Personal message (optional)</Label>
          <Textarea
            id="email-message"
            placeholder="Add a short message shown above the voting button..."
            value={template.message}
            onChange={(e) => setTemplate({ ...template, message: e.target.value })}
            rows={3}
            maxLength={2000}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          The election title, description, and each voter&apos;s unique voting
          link are always included automatically.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview((p) => !p)}
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "Hide preview" : "Preview"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleSaveTemplate} disabled={saving}>
          {saving ? "Saving..." : "Save template"}
        </Button>
        <Button
          size="sm"
          onClick={handleSendAll}
          disabled={sending || pendingCount === 0}
          className="ml-auto"
        >
          <Send className="h-4 w-4" />
          {sending
            ? "Sending..."
            : pendingCount === 0
              ? "All invitations sent"
              : `Send ${pendingCount} invitation(s)`}
        </Button>
      </div>

      {/* Gmail daily limit warning */}
      {totalVoters > GMAIL_WARNING_THRESHOLD && (
        <p className="text-xs text-[var(--warning)] bg-[var(--warning-light)] px-3 py-2 rounded-lg">
          Gmail limits sending to roughly 500 emails per day. With{" "}
          {totalVoters} voters, you may need to send invitations across
          multiple days.
        </p>
      )}

      {/* Send progress */}
      {sending && progress && (
        <div className="space-y-1.5">
          <Progress
            value={pendingCount > 0 ? (totalToSend / pendingCount) * 100 : 100}
            className="h-2"
          />
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            {progress.sent} sent
            {progress.failed > 0 && ` · ${progress.failed} failed`} of {pendingCount}
          </p>
        </div>
      )}

      {/* Live preview */}
      {showPreview && (
        <div className="space-y-2 rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="bg-[var(--background)] px-4 py-2 border-b border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">
              Subject:{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {previewSubject || "..."}
              </span>
            </p>
          </div>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              sandbox=""
              title="Email preview"
              className="w-full h-[420px] bg-white"
            />
          ) : (
            <p className="text-xs text-[var(--text-muted)] p-4">
              Rendering preview...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
