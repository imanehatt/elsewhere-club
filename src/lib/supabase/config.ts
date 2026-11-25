export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the Supabase environment variables are set (see README → Step 2). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
