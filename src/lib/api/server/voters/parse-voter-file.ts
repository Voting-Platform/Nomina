"use server";

import * as XLSX from "xlsx";
import { requireAuth } from "@/lib/api/server/require-auth";
import type { VoterEntry } from "@/types";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_ENTRIES = 2000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_EXTENSIONS = [".xlsx", ".csv"];

export interface ParseVoterFileResult {
  success: boolean;
  error?: string;
  entries: VoterEntry[];
  validCount: number;
  invalidRows: number[];
  duplicateCount: number;
  truncated: boolean;
}

const failure = (error: string): ParseVoterFileResult => ({
  success: false,
  error,
  entries: [],
  validCount: 0,
  invalidRows: [],
  duplicateCount: 0,
  truncated: false,
});

/**
 * Parses a .xlsx/.csv voter list into { email, name } entries.
 * Pure parse — no DB writes — so it serves both the creation wizard
 * (entries kept in wizard state) and the share tab (entries → addVoters).
 */
export async function parseVoterFile(
  formData: FormData
): Promise<ParseVoterFileResult> {
  await requireAuth();

  const file = formData.get("file");
  if (!(file instanceof File)) return failure("No file provided");

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return failure("Only .xlsx and .csv files are supported");
  }
  if (file.size > MAX_FILE_SIZE) {
    return failure("File is too large (max 2MB)");
  }

  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), {
      type: "buffer",
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return failure("The file contains no sheets");
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
  } catch {
    return failure("Could not read the file. Is it a valid spreadsheet?");
  }

  if (rows.length === 0) return failure("The file contains no rows");

  // Locate the email (and optional name) columns by header
  const headers = Object.keys(rows[0]);
  let emailCol = headers.find((h) => /e-?mail/i.test(h));
  const nameCol = headers.find((h) => /^(full\s*)?name$/i.test(h));

  // No header match: sheet_to_json used row 1 as headers — check whether a
  // header itself is an email (headerless file) and treat it as data.
  let headerRowEntry: VoterEntry | null = null;
  if (!emailCol) {
    const emailHeader = headers.find((h) => EMAIL_REGEX.test(h.trim()));
    if (!emailHeader) {
      return failure(
        'No email column found. Add an "email" header or put emails in the first column.'
      );
    }
    emailCol = emailHeader;
    headerRowEntry = { email: emailHeader.trim().toLowerCase() };
  }

  const entries: VoterEntry[] = [];
  const invalidRows: number[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;
  let truncated = false;

  const pushEntry = (rowNumber: number, rawEmail: string, rawName?: string) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) return; // skip blank rows silently
    if (!EMAIL_REGEX.test(email)) {
      invalidRows.push(rowNumber);
      return;
    }
    if (seen.has(email)) {
      duplicateCount++;
      return;
    }
    if (entries.length >= MAX_ENTRIES) {
      truncated = true;
      return;
    }
    seen.add(email);
    const name = rawName?.trim();
    entries.push(name ? { email, name } : { email });
  };

  if (headerRowEntry) pushEntry(1, headerRowEntry.email);

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // 1-based + header row
    pushEntry(
      rowNumber,
      String(row[emailCol!] ?? ""),
      nameCol ? String(row[nameCol] ?? "") : undefined
    );
  });

  if (entries.length === 0) {
    return failure("No valid email addresses found in the file");
  }

  return {
    success: true,
    entries,
    validCount: entries.length,
    invalidRows,
    duplicateCount,
    truncated,
  };
}
