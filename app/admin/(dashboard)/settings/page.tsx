import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, fmtDateTime } from "@/components/admin/AdminHeader";
import { ActionForm } from "@/components/admin/ActionForm";
import { ModeBadge } from "@/components/admin/BookingBadge";
import { Submit } from "@/components/admin/ui";
import { saveBankSettings, saveOrganizerSettings, setLiveMode } from "@/app/admin/booking-actions";
import { DEFAULT_BANK, DEFAULT_ORGANIZER, missingForLive } from "@/lib/booking/settings";
import type { BankSettings, OrganizerSettings } from "@/lib/booking/types";
import { emailConfigured } from "@/lib/booking/email";
import { isServiceConfigured } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function Card({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-olive/5 sm:p-8">
      <h2 className="text-2xl">{title}</h2>
      {intro && <p className="mt-1 max-w-2xl text-sm text-olive-soft">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function F({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-olive/50">{hint}</span>}
    </label>
  );
}

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: o }, { data: bk }] = await Promise.all([
    supabase.from("organizer_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("bank_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const org: OrganizerSettings = { ...DEFAULT_ORGANIZER, ...(o ?? {}) };
  const bank: BankSettings = { ...DEFAULT_BANK, ...(bk ?? {}) };
  const tiers = [...(org.cancellation_tiers ?? []), ...Array(6).fill({ period: "", refund: "" })].slice(0, 6);
  const missing = missingForLive(org, bank);

  return (
    <>
      <AdminHeader title="Booking settings" intro="Your legal company details, cancellation policy and bank details. They fill in the booking agreement, the legal pages and the payment page — nothing here is hard-coded." actions={<ModeBadge live={org.live_mode} />} />

      <div className="space-y-6">
        <Card title="Go live" intro="Live mode stays OFF until you approve the final configuration. To go live you need your WhatsApp number. While it's off, approvals are test bookings: travelers get no emails and every booking page says “Test mode — do not send money”.">
          <ul className="mb-5 grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2">{isServiceConfigured ? <CheckCircle2 className="h-4 w-4 text-sage" /> : <AlertTriangle className="h-4 w-4 text-terracotta" />}Database service key {isServiceConfigured ? "connected" : "missing (SUPABASE_SERVICE_ROLE_KEY)"}</li>
            <li className="flex items-center gap-2">{emailConfigured() ? <CheckCircle2 className="h-4 w-4 text-sage" /> : <AlertTriangle className="h-4 w-4 text-terracotta" />}Email sending {emailConfigured() ? "set up" : "not set up (RESEND_API_KEY)"}</li>
          </ul>
          {missing.length > 0 ? (
            <div className="rounded-xl bg-champagne-light p-4 text-sm text-olive">
              <p className="font-medium">Still needed before you can go live:</p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          ) : !org.live_mode ? (
            <p className="rounded-xl bg-sage-light p-4 text-sm text-olive">Everything required is filled in. Review the agreement preview on a test booking, then switch live mode on.</p>
          ) : null}
          {org.live_mode ? (
            <ActionForm action={setLiveMode} className="mt-5" confirm="Switch the booking system back to test mode?">
              <input type="hidden" name="live" value="off" />
              <p className="mb-3 text-sm text-olive-soft">Live since {org.live_approved_at ? fmtDateTime(org.live_approved_at) : "—"}{org.live_approved_by ? `, approved by ${org.live_approved_by.replace("admin:", "")}` : ""}.</p>
              <Submit variant="ghost">Switch back to test mode</Submit>
            </ActionForm>
          ) : (
            <ActionForm action={setLiveMode} className="mt-5 space-y-3">
              <input type="hidden" name="live" value="on" />
              <label className="flex items-start gap-2 text-sm text-olive"><input type="checkbox" name="approve" className="mt-1 accent-terracotta" disabled={missing.length > 0} />I have reviewed the booking agreement, cancellation policy, legal pages and bank details, and I approve this final configuration for real bookings and payments.</label>
              <Submit className={missing.length ? "pointer-events-none opacity-50" : ""}>Switch live mode on</Submit>
            </ActionForm>
          )}
        </Card>

        <ActionForm action={saveOrganizerSettings} className="space-y-6">
          <Card title="Organizer details" intro="Optional. Shown on receipts, in the footer and on the legal pages. The company email is also the contact in section 7 of the agreement (otherwise imanehattani0@gmail.com).">
            <div className="grid gap-5 sm:grid-cols-2">
              <F label="Legal company name" ><input name="company_legal_name" defaultValue={org.company_legal_name} className="field" /></F>
              <F label="Business registration / travel license number" ><input name="registration_number" defaultValue={org.registration_number} className="field" /></F>
              <F label="Registered business address"  wide><textarea name="company_address" rows={2} defaultValue={org.company_address} className="field" /></F>
              <F label="Company email" hint="Section 7 contact in the agreement"><input name="company_email" type="email" defaultValue={org.company_email} className="field" /></F>
              <F label="WhatsApp number (with country code)" hint="After signing, travelers tap “Message us on WhatsApp” to get the bank details from you. Required to go live."><input name="whatsapp_number" type="tel" defaultValue={org.whatsapp_number} placeholder="+212 600 000000" className="field" /></F>
              <F label="Complaints / support email" hint="For complaints and support (optional)"><input name="support_email" type="email" defaultValue={org.support_email} className="field" /></F>
              <F label="Official website" ><input name="website_url" defaultValue={org.website_url} placeholder="www.yourdomain.com" className="field" /></F>
              <F label="Governing law" hint="Shown on the Terms & Conditions page"><input name="governing_law" defaultValue={org.governing_law} className="field" /></F>
            </div>
          </Card>

          <Card title="Cancellation & refund policy" intro="Optional — your “cancellation conditions communicated at booking” (section 4). If filled in, the table appears in every agreement, on the trip page and on the Cancellation & Refund Policy page. Empty rows are removed.">
            <div className="space-y-3">
              <div className="hidden grid-cols-2 gap-3 text-xs uppercase tracking-[0.12em] text-olive/55 sm:grid"><span>Cancellation period</span><span>Applicable refund</span></div>
              {tiers.map((t, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-2">
                  <input name={`tier_period_${i}`} defaultValue={t.period} placeholder={["On or before [DATE]", "Between [DATE] and [DATE]", "After [DATE]"][i] ?? "Optional extra row"} aria-label={`Cancellation period ${i + 1}`} className="field" />
                  <input name={`tier_refund_${i}`} defaultValue={t.refund} placeholder={i < 3 ? "[REFUND AMOUNT OR PERCENTAGE]" : ""} aria-label={`Refund ${i + 1}`} className="field" />
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <F label="Refund processing time (days)" hint="Optional"><input name="refund_days" type="number" min={1} max={365} defaultValue={org.refund_days ?? ""} className="field" /></F>
            </div>
          </Card>

          <Card title="Agreement & secure links">
            <div className="grid gap-5 sm:grid-cols-2">
              <F label="Agreement version" hint="Raise this (e.g. v1.1) whenever you change the contract wording. Each signed copy stores the version it was signed under."><input name="agreement_version" defaultValue={org.agreement_version} className="field" /></F>
              <F label="Traveler links expire after (days)" hint="For security, links stop working after this many days. You can send a new link at any time."><input name="link_validity_days" type="number" min={1} max={90} defaultValue={org.link_validity_days} className="field" /></F>
            </div>
          </Card>

          <Card title="Legal page texts" intro="Paste your final, lawyer-reviewed texts here. While a box is empty, the page shows a clearly marked draft instead. Separate paragraphs with a blank line; start a line with “## ” for a heading or “- ” for a bullet.">
            <div className="grid gap-5">
              <F label="Terms & Conditions"><textarea name="terms_text" rows={8} defaultValue={org.terms_text} className="field font-mono text-xs" /></F>
              <F label="Privacy Policy"><textarea name="privacy_text" rows={8} defaultValue={org.privacy_text} className="field font-mono text-xs" /></F>
            </div>
          </Card>
          <div className="sticky bottom-4 z-10 flex justify-end"><Submit className="shadow-lg">Save settings</Submit></div>
        </ActionForm>

        <ActionForm action={saveBankSettings}>
          <Card title="Bank details" intro="Optional, for your own reference — these are not shown on the website. Travelers get the bank details from you on WhatsApp, and they appear on receipts only if you fill them in here.">
            <div className="grid gap-5 sm:grid-cols-2">
              <F label="Account holder name"><input name="account_holder" defaultValue={bank.account_holder} className="field" autoComplete="off" /></F>
              <F label="Bank name"><input name="bank_name" defaultValue={bank.bank_name} className="field" autoComplete="off" /></F>
              <F label="IBAN / account number"><input name="iban" defaultValue={bank.iban} className="field font-mono" autoComplete="off" /></F>
              <F label="SWIFT / BIC" hint="Where applicable"><input name="swift_bic" defaultValue={bank.swift_bic} className="field font-mono" autoComplete="off" /></F>
              <F label="Extra instructions" hint="Optional, e.g. “International transfers: choose OUR for fees”" wide><textarea name="extra_instructions" rows={2} defaultValue={bank.extra_instructions} className="field" /></F>
            </div>
            <div className="mt-6"><Submit>Save bank details</Submit></div>
          </Card>
        </ActionForm>
      </div>
    </>
  );
}
