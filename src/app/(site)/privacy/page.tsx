import type { Metadata } from "next";
import { LegalPage, PlainLegalText } from "@/components/LegalPage";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "How The Elsewhere Club collects, uses and protects your personal information.", alternates: { canonical: "/privacy" } };
export const revalidate = 60;

const ph = (v: string, p: string) => v || p;

export default async function PrivacyPage() {
  const org = await getOrganizerSettings();
  if (org.privacy_text) return <LegalPage title="Privacy Policy" draft={false}><PlainLegalText text={org.privacy_text} /></LegalPage>;
  const email = org.support_email || org.company_email || site.contactEmail;
  return (
    <LegalPage title="Privacy Policy" updated="[DATE]">
      <h2>1. Who we are</h2>
      <p>The Elsewhere Club is a trading name of {ph(org.company_legal_name, "[REGISTERED COMPANY NAME]")}, {ph(org.company_address, "[ADDRESS]")}, registration number {ph(org.registration_number, "[NUMBER]")}. Contact: {email}.</p>
      <h2>2. Information we collect</h2>
      <ul>
        <li>Details you give us in forms: name, email, phone/WhatsApp number, country of residence, travel preferences, trip and flight requests, and any notes you add.</li>
        <li>When you request a spot on a trip: your full legal name, date of birth, nationality and number of travelers.</li>
        <li>When you sign a booking agreement: your typed name, your drawn signature, the date and time, the agreement version, and your IP address and browser details, kept as a record of your signature.</li>
        <li>When you pay: the proof of payment you upload and the payments we receive.</li>
        <li>Basic technical data needed to run and secure the website (e.g. server logs).</li>
      </ul>
      <h2>3. How we use it</h2>
      <ul>
        <li>To review your request, prepare your booking agreement, verify your payments and deliver your trip.</li>
        <li>To respond to your inquiries and flight quote requests.</li>
        <li>To send trip announcements if you joined the club or opted in (you can unsubscribe anytime).</li>
        <li>To share necessary details with service providers (such as accommodation, transport and activity providers) where necessary and lawful.</li>
        <li>To keep the website secure and prevent spam.</li>
      </ul>
      <h2>4. Legal basis</h2>
      <p>[Complete according to applicable law, e.g. consent, steps prior to entering a contract, performance of a contract, legitimate interests.]</p>
      <h2>5. Where your data is stored</h2>
      <p>Your information is stored securely with our database provider (Supabase) in [REGION]. Proofs of payment are kept in private storage that is never public. Access is restricted to authorised administrators. [List any other processors, e.g. the email provider.]</p>
      <h2>6. How long we keep it</h2>
      <p>[Retention periods, e.g. for inquiries, signed agreements and payment records.]</p>
      <h2>7. Your rights</h2>
      <p>Depending on where you live, you may have the right to access, correct, delete or export your data, and to object to or restrict processing. Email {email} to make a request. [Add supervisory authority details.]</p>
      <h2>8. Cookies</h2>
      <p>The public website does not use advertising or analytics cookies. Essential cookies are used only for the private admin login. [Update if you add analytics.]</p>
      <h2>9. Changes</h2>
      <p>We may update this policy and will post the new version here.</p>
    </LegalPage>
  );
}
