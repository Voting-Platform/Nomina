"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

interface CalendarInputProps {
  value: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  disablePast?: boolean;
}

export default function CalendarInput({
  value,
  onSelect,
  className,
  contentClassName,
  disabled,
  placeholder,
  disablePast,
}: CalendarInputProps) {
  const [selectedHour, setSelectedHour] = React.useState<number>(12);
  const [selectedMinute, setSelectedMinute] = React.useState<number>(0);
  const [period, setPeriod] = React.useState<"AM" | "PM">("AM");

  const hourScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const minuteScrollContainerRef = React.useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Sync internal state with prop value
  React.useEffect(() => {
    if (value) {
      let h = value.getHours();
      const m = value.getMinutes();
      const p = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12; // Convert 0 to 12
      setSelectedHour(h);
      setSelectedMinute(m);
      setPeriod(p);
    }
  }, [value]);

  // Center selected values in scroll containers on popover open
  const handleOpenChange = (open: boolean) => {
    if (open && value) {
      setTimeout(() => {
        hourScrollContainerRef.current
          ?.querySelector('[data-selected="true"]')
          ?.scrollIntoView({ block: "center", behavior: "auto" });
        minuteScrollContainerRef.current
          ?.querySelector('[data-selected="true"]')
          ?.scrollIntoView({ block: "center", behavior: "auto" });
      }, 80);
    }
  };

  const updateDateTime = (newDate: Date | undefined, hour: number, minute: number, p: "AM" | "PM") => {
    if (!newDate) return;
    const updated = new Date(newDate);
    let h24 = hour % 12;
    if (p === "PM") {
      h24 += 12;
    }
    updated.setHours(h24, minute, 0, 0);

    if (disablePast) {
      const now = new Date();
      if (updated < now) {
        updated.setTime(now.getTime());
      }
    }

    onSelect(updated);
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        type="button"
        className={cn(
          "w-full justify-start text-left font-normal border border-[var(--border)] hover:bg-[var(--surface-hover)] bg-[var(--surface)] text-[var(--text-primary)] h-10 px-3 py-2 rounded-lg transition-all flex items-center cursor-pointer",
          !value && "text-[var(--text-muted)]",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        {value ? format(value, "PPP hh:mm a") : <span>{placeholder || "Pick date & time"}</span>}
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0 flex flex-col sm:flex-row border-[var(--border)] bg-[var(--surface)] shadow-lg rounded-xl overflow-hidden", contentClassName)}
        align="start"
      >
        {/* Calendar Picker (Left side) */}
        <Calendar
          mode="single"
          selected={value}
          disabled={disablePast ? { before: new Date(new Date().setHours(0,0,0,0)) } : undefined}
          onSelect={(d) => {
            if (d) {
              updateDateTime(d, selectedHour, selectedMinute, period);
            } else {
              onSelect(undefined);
            }
          }}
        />

        {/* Time Selection Columns (Right side) */}
        <div className="flex border-t sm:border-t-0 sm:border-l border-[var(--border)] p-3 items-stretch h-[245px] bg-[var(--surface)] select-none">
          {/* Hour column */}
          <div className="flex flex-col gap-1 items-center">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">Hour</span>
            <div
              ref={hourScrollContainerRef}
              className="flex-1 overflow-y-auto w-10 scrollbar-none flex flex-col gap-0.5 border-r border-[var(--border)] pr-2"
            >
              {hours.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      setSelectedHour(h);
                      updateDateTime(value || new Date(), h, selectedMinute, period);
                    }}
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-lg text-xs transition-all flex items-center justify-center font-medium",
                      isSelected
                        ? "bg-[var(--primary)] text-white"
                        : "hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                    )}
                  >
                    {h.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minute column */}
          <div className="flex flex-col gap-1 items-center pl-2">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">Min</span>
            <div
              ref={minuteScrollContainerRef}
              className="flex-1 overflow-y-auto w-10 scrollbar-none flex flex-col gap-0.5 border-r border-[var(--border)] pr-2"
            >
              {minutes.map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      setSelectedMinute(m);
                      updateDateTime(value || new Date(), selectedHour, m, period);
                    }}
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-lg text-xs transition-all flex items-center justify-center font-medium",
                      isSelected
                        ? "bg-[var(--primary)] text-white"
                        : "hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                    )}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period column (AM/PM) */}
          <div className="flex flex-col gap-1 items-center pl-2">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">Period</span>
            <div className="flex flex-col gap-2 justify-center flex-1">
              {(["AM", "PM"] as const).map((p) => {
                const isSelected = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      updateDateTime(value || new Date(), selectedHour, selectedMinute, p);
                    }}
                    className={cn(
                      "h-8 px-2 rounded-lg text-xs font-bold transition-all border",
                      isSelected
                        ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                        : "hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)]"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
