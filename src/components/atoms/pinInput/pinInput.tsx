"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Segmented digit input used for election PINs and email OTP codes.
 */
export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  className,
}: PinInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = (i: number) => {
    refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();
  };

  const setDigits = (digits: string) => {
    const next = digits.replace(/\D/g, "").slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const chars = value.split("");
    chars[i] = digit;
    setDigits(chars.join(""));
    focusIndex(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[i]) {
        chars[i] = "";
        setDigits(chars.join(""));
      } else {
        focusIndex(i - 1);
        const prev = value.split("");
        prev[i - 1] = "";
        setDigits(prev.join(""));
      }
    } else if (e.key === "ArrowLeft") {
      focusIndex(i - 1);
    } else if (e.key === "ArrowRight") {
      focusIndex(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDigits(e.clipboardData.getData("text"));
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-[var(--border)] bg-[var(--surface)]",
            "text-center text-xl font-bold text-[var(--text-primary)] tabular-nums",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]",
            "disabled:opacity-50 transition-all duration-150"
          )}
        />
      ))}
    </div>
  );
}
