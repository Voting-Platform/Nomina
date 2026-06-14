import "server-only";
import { headers } from "next/headers";

/* ═══════════════════════════════════════════════════════════════
   In-memory sliding-window rate limiter.
   Suitable for a single-instance deployment; swap the Map for
   Redis/Upstash if the app is ever scaled horizontally.
   ═══════════════════════════════════════════════════════════════ */

type WindowEntry = {
  timestamps: number[];
};

const store = new Map<string, WindowEntry>();

let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

function prune(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(
      (t) => now - t < MAX_WINDOW_MS
    );
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
}

/**
 * Records a hit against `key` and reports whether the caller is within
 * `max` hits per `windowMs`.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    store.set(key, entry);
    return { ok: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { ok: true, retryAfterMs: 0 };
}

/** Best-effort client IP for rate-limit keys. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
