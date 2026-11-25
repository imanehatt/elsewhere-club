import type { BookingStatus, PaymentKind } from "./constants";

export interface CancellationTier {
  period: string;
  refund: string;
}

export interface OrganizerSettings {
  company_legal_name: string;
  company_address: string;
  registration_number: string;
  company_email: string;
  support_email: string;
  /** WhatsApp number travelers message after signing to receive the bank details. */
  whatsapp_number: string;
  website_url: string;
  governing_law: string;
  refund_days: number | null;
  cancellation_tiers: CancellationTier[];
  agreement_version: string;
  link_validity_days: number;
  terms_text: string;
  privacy_text: string;
  live_mode: boolean;
  live_approved_by: string | null;
  live_approved_at: string | null;
}

export interface BankSettings {
  account_holder: string;
  bank_name: string;
  iban: string;
  swift_bic: string;
  extra_instructions: string;
}

export interface Booking {
  id: string;
  reference: string | null;
  trip_id: string | null;
  trip_slug: string;
  trip_title: string;
  trip_start: string | null;
  trip_end: string | null;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  nationality: string;
  date_of_birth: string;
  travelers: number;
  special_requests: string | null;
  wants_flight_quote: boolean;
  status: BookingStatus;
  declined: boolean;
  cancel_reason: string | null;
  currency: string | null;
  price_per_person: number | null;
  deposit_per_person: number | null;
  total_amount: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  deposit_deadline: string | null;
  balance_deadline: string | null;
  token_expires_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  link_sent_at: string | null;
  agreement_viewed_at: string | null;
  signed_at: string | null;
  confirmed_at: string | null;
  confirmation_sent_at: string | null;
  cancelled_at: string | null;
  is_test: boolean;
  admin_notes: string | null;
  created_at: string;
}

export interface BookingPayment {
  id: string;
  booking_id: string;
  kind: PaymentKind;
  expected_amount: number;
  proof_path: string | null;
  proof_name: string | null;
  proof_uploaded_at: string | null;
  status: "under_review" | "verified" | "rejected";
  received_amount: number | null;
  received_on: string | null;
  verified_at: string | null;
  verified_by: string | null;
  review_note: string | null;
  receipt_number: string | null;
  created_at: string;
}

export interface BookingAgreementRow {
  id: string;
  booking_id: string;
  version: string;
  content_hash: string;
  content: import("./agreement").AgreementDoc;
  signer_name: string;
  signature_png: string;
  signed_at: string;
  ip: string | null;
  user_agent: string | null;
}

export interface BookingEvent {
  id: number;
  booking_id: string | null;
  at: string;
  actor: string;
  action: string;
  details: Record<string, unknown>;
}
