"use client";

import { Label } from "@/components/ui/label";
import { Clock, Zap, Calendar, Globe } from "lucide-react";
import type { SchedulingInput, SchedulingMode } from "@/types/election";
import CalendarInput from "@/components/ui/calendar-input";

interface SchedulingFormProps {
  scheduling: SchedulingInput;
  onSchedulingChange: (scheduling: SchedulingInput) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

const MODE_OPTIONS: { value: SchedulingMode; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Open and close the election manually whenever you want",
    icon: Zap,
  },
  {
    value: "automatic",
    label: "Automatic",
    description: "Set specific start and end dates; the election opens and closes automatically",
    icon: Clock,
  },
];

export function SchedulingForm({ scheduling, onSchedulingChange, errors, disabled }: SchedulingFormProps) {
  return (
    <div className="space-y-4">
      {errors?.scheduling && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.scheduling}
        </p>
      )}
      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = scheduling.mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSchedulingChange({ ...scheduling, mode: option.value })
              }
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]/50 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg
                  ${isSelected ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Automatic mode: date/time pickers */}
      {scheduling.mode === "automatic" && (
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mt-2 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
                Start Date & Time
              </Label>
              <CalendarInput
                value={scheduling.scheduledStartAt ? new Date(scheduling.scheduledStartAt) : undefined}
                onSelect={(d) =>
                  onSchedulingChange({
                    ...scheduling,
                    scheduledStartAt: d ? d.toISOString() : undefined,
                  })
                }
                disabled={disabled}
                disablePast={true}
                placeholder="Select start date & time"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
                End Date & Time
              </Label>
              <CalendarInput
                value={scheduling.scheduledEndAt ? new Date(scheduling.scheduledEndAt) : undefined}
                onSelect={(d) =>
                  onSchedulingChange({
                    ...scheduling,
                    scheduledEndAt: d ? d.toISOString() : undefined,
                  })
                }
                disabled={disabled}
                placeholder="Select end date & time"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)] mt-2">
            {/* Timezone label */}
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Times are in local time ({typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"})
            </p>

            {/* Duration label */}
            {scheduling.scheduledStartAt && scheduling.scheduledEndAt && (
              <div className="flex items-center gap-1.5 rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs text-[var(--primary)] font-semibold">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Duration:{" "}
                  {(() => {
                    const start = new Date(scheduling.scheduledStartAt);
                    const end = new Date(scheduling.scheduledEndAt);
                    const diffMs = end.getTime() - start.getTime();
                    if (isNaN(diffMs) || diffMs <= 0) return "Invalid";
                    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
                    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""}`;
                    const diffDays = Math.floor(diffHours / 24);
                    const remainingHours = diffHours % 24;
                    if (remainingHours === 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ${remainingHours} hr${remainingHours !== 1 ? "s" : ""}`;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual mode info */}
      {scheduling.mode === "manual" && (
        <div className="rounded-xl border border-[var(--info-light)] bg-[var(--info-light)] p-4">
          <p className="text-sm text-[var(--info)]">
            With manual scheduling, you&apos;ll control when voting opens and closes from the election dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
