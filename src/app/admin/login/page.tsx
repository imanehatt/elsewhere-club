import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-svh items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-ivory p-8 shadow-xl ring-1 ring-olive/5 sm:p-10">
        <Logo />
        <h1 className="mt-8 text-3xl">Admin sign in</h1>
        {!isSupabaseConfigured ? (
          <div className="mt-6 space-y-3 rounded-2xl bg-champagne-light p-5 text-sm leading-relaxed text-olive">
            <p className="font-semibold">Setup required</p>
            <p>The admin dashboard needs a Supabase database. Follow <strong>README → Step 2 & 3</strong> to connect it and create your admin login, then restart the site.</p>
          </div>
        ) : (
          <div className="mt-6">
            {error === "not_admin" && (
              <p className="mb-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">That account isn&apos;t an admin. Add it to the admin_users table (README Step 3).</p>
            )}
            <LoginForm />
          </div>
        )}
      </div>
    </div>
  );
}
