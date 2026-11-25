import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { serverClient } from "./supabase/server";

/**
 * Use at the top of every admin page, route and action.
 * Confirms the visitor is signed in AND listed in admin_users.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?error=not_admin");
  return { supabase, user: auth.user };
}

/** Same check for route handlers / actions where redirecting isn't ideal. */
export async function getAdmin() {
  if (!isSupabaseConfigured) return null;
  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? { supabase, user: auth.user } : null;
}
