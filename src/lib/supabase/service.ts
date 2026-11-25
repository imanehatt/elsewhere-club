import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseUrl } from "./config";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True once SUPABASE_SERVICE_ROLE_KEY is set (README → Step 2). Needed for bookings. */
export const isServiceConfigured = isSupabaseConfigured && Boolean(serviceKey);

/**
 * Server-only client that bypasses Row Level Security.
 * Used ONLY for traveler booking pages (after checking their secret link)
 * and for saving booking requests. Never import this into client code.
 */
export function serviceClient() {
  if (!isServiceConfigured) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
