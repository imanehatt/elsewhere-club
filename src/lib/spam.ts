/**
 * Lightweight spam protection, no third-party account needed:
 *  1. Honeypot — a hidden "website" field humans never fill in.
 *  2. Time trap — forms submitted < 3 seconds after loading are rejected.
 * For heavier protection later, add Cloudflare Turnstile (see README).
 */
export function isLikelySpam(form: FormData): boolean {
  const honeypot = String(form.get("website") ?? "");
  if (honeypot.trim() !== "") return true;
  const started = Number(form.get("_started") ?? 0);
  if (!started) return true;
  const elapsed = Date.now() - started;
  return elapsed < 3000 || elapsed > 1000 * 60 * 60 * 24;
}
