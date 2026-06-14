"use client";

import Image from "next/image";
import { Check, Minus, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicCandidateData } from "@/types";

interface CandidateBallotCardProps {
  candidate: PublicCandidateData;
  count: number;
  /** Single-choice ballots render as selectable cards instead of steppers. */
  singleChoice: boolean;
  /** Highest count this candidate can still receive on this ballot. */
  maxSelectable: number;
  onCountChange: (candidateId: string, count: number) => void;
  disabled?: boolean;
}

export function CandidateBallotCard({
  candidate,
  count,
  singleChoice,
  maxSelectable,
  onCountChange,
  disabled = false,
}: CandidateBallotCardProps) {
  const unavailable = !candidate.isEligibleForVoting || candidate.isFull;
  const selected = count > 0;
  const interactive = !disabled && !unavailable;

  const handleCardClick = () => {
    if (!interactive || !singleChoice) return;
    onCountChange(candidate._id, selected ? 0 : 1);
  };

  return (
    <div
      role={singleChoice ? "radio" : undefined}
      aria-checked={singleChoice ? selected : undefined}
      tabIndex={singleChoice && interactive ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (singleChoice && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={cn(
        "rounded-xl border bg-[var(--surface)] p-4 transition-all duration-200",
        selected
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15 shadow-md"
          : "border-[var(--border)]",
        singleChoice && interactive && "cursor-pointer hover:border-[var(--primary)]/50",
        unavailable && "opacity-55"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Photo */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)]">
          {candidate.imageUrl ? (
            <Image
              src={candidate.imageUrl}
              alt={candidate.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-6 w-6 text-[var(--text-muted)]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {candidate.name}
          </p>
          {candidate.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
              {candidate.description}
            </p>
          )}
          {unavailable && (
            <p className="text-xs font-medium text-[var(--destructive)] mt-1">
              {candidate.isFull
                ? "Reached maximum votes"
                : "Not eligible for voting"}
            </p>
          )}
        </div>

        {/* Selector */}
        {singleChoice ? (
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              selected
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)]"
            )}
          >
            {selected && <Check className="h-3.5 w-3.5" />}
          </div>
        ) : (
          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={!interactive || count === 0}
              onClick={() => onCountChange(candidate._id, count - 1)}
              aria-label={`Remove a vote for ${candidate.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-[var(--text-primary)] tabular-nums">
              {count}
            </span>
            <button
              type="button"
              disabled={!interactive || count >= maxSelectable}
              onClick={() => onCountChange(candidate._id, count + 1)}
              aria-label={`Add a vote for ${candidate.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
