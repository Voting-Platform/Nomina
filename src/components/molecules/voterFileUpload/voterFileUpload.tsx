"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { parseVoterFile } from "@/lib/api/server";
import type { VoterEntry } from "@/types";

interface VoterFileUploadProps {
  onEntriesParsed: (entries: VoterEntry[]) => void;
  disabled?: boolean;
}

/**
 * Uploads a .xlsx/.csv voter list, parses it server-side, and hands the
 * valid entries to the parent. Shows a parse summary (invalid/duplicate
 * rows) inline.
 */
export function VoterFileUpload({ onEntriesParsed, disabled }: VoterFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setParsing(true);
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await parseVoterFile(formData);
      if (!result.success) {
        setError(result.error ?? "Could not parse the file");
        return;
      }
      onEntriesParsed(result.entries);
      const parts = [`${result.validCount} voter(s) found`];
      if (result.invalidRows.length > 0) {
        parts.push(`${result.invalidRows.length} invalid row(s) skipped`);
      }
      if (result.duplicateCount > 0) {
        parts.push(`${result.duplicateCount} duplicate(s) skipped`);
      }
      if (result.truncated) parts.push("list truncated at 2,000");
      setSummary(parts.join(" · "));
    } catch {
      setError("Could not parse the file");
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        disabled={disabled || parsing}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={disabled || parsing}
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-5 text-sm text-[var(--text-secondary)] hover:border-[var(--primary)]/50 hover:text-[var(--text-primary)] disabled:opacity-50 transition-all duration-200"
      >
        {parsing ? (
          <>
            <Upload className="h-4 w-4 animate-pulse" />
            Parsing file...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4" />
            Upload .xlsx or .csv with voter emails
          </>
        )}
      </button>
      {summary && (
        <p className="text-xs text-[var(--secondary)]">{summary}</p>
      )}
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
