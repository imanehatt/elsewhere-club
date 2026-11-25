import "server-only";
import { cache } from "react";
import { publicClient } from "../supabase/public";
import { serviceClient } from "../supabase/service";
import type { BankSettings, CancellationTier, OrganizerSettings } from "./types";

export const EMPTY_TIERS: CancellationTier[] = [
  { period: "", refund: "" },
  { period: "", refund: "" },
  { period: "", refund: "" },
];

export const DEFAULT_ORGANIZER: OrganizerSettings = {
  company_legal_name: "",
  company_address: "",
  registration_number: "",
  company_email: "",
  support_email: "",
  whatsapp_number: "",
  website_url: "",
  governing_law: "",
  refund_days: null,
  cancellation_tiers: EMPTY_TIERS,
  agreement_version: "v1.0",
  link_validity_days: 14,
  terms_text: "",
  privacy_text: "",
  live_mode: false,
  live_approved_by: null,
  live_approved_at: null,
};

export const DEFAULT_BANK: BankSettings = { account_holder: "", bank_name: "", iban: "", swift_bic: "", extra_instructions: "" };

function normalizeOrganizer(row: Partial<OrganizerSettings> | null): OrganizerSettings {
  const o = { ...DEFAULT_ORGANIZER, ...(row ?? {}) };
  const tiers = Array.isArray(o.cancellation_tiers) && o.cancellation_tiers.length ? o.cancellation_tiers : EMPTY_TIERS;
  return { ...o, cancellation_tiers: tiers.map((t) => ({ period: t?.period ?? "", refund: t?.refund ?? "" })) };
}

/** Organizer + legal settings. Safe to show publicly (no bank details). */
export const getOrganizerSettings = cache(async (): Promise<OrganizerSettings> => {
  const db = serviceClient() ?? publicClient();
  if (!db) return DEFAULT_ORGANIZER;
  const { data, error } = await db.from("organizer_settings").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("[settings] organizer:", error.message);
  return normalizeOrganizer(data);
});

/** Bank details — server only. Never pass these to public pages unless the traveler has signed. */
export async function getBankSettings(): Promise<BankSettings> {
  const db = serviceClient();
  if (!db) return DEFAULT_BANK;
  const { data, error } = await db.from("bank_settings").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("[settings] bank:", error.message);
  return { ...DEFAULT_BANK, ...(data ?? {}) };
}

/** "+212 600-123456" → "212600123456" (wa.me format), or "" if it isn't a usable number. */
export const whatsappDigits = (n: string) => {
  const d = (n || "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15 ? d : "";
};

export const bankComplete = (b: BankSettings) => Boolean(b.account_holder && b.bank_name && b.iban);
export const tiersComplete = (tiers: CancellationTier[]) => tiers.length > 0 && tiers.every((t) => t.period.trim() && t.refund.trim());

/** Everything that must be filled in before live mode can be switched on. */
export function missingForLive(o: OrganizerSettings, b: BankSettings): string[] {
  const missing: string[] = [];
  // The booking agreement needs bank details to take payments. Company details,
  // the cancellation table and legal texts are optional (shown when filled in).
  if (o.cancellation_tiers.some((t) => t.period.trim() || t.refund.trim()) && !tiersComplete(o.cancellation_tiers)) missing.push("Cancellation table (finish or clear the half-filled rows)");
  if (!whatsappDigits(o.whatsapp_number)) missing.push("WhatsApp number (travelers message it for the bank details)");
  void b;
  return missing;
}
