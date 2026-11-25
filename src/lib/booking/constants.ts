/** Booking statuses, in the order a booking normally moves through them. */
export const BOOKING_STATUSES = [
  "inquiry_received",
  "approved",
  "agreement_pending",
  "agreement_signed",
  "awaiting_payment",
  "payment_under_review",
  "confirmed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  inquiry_received: "Inquiry Received",
  approved: "Approved",
  agreement_pending: "Agreement Pending",
  agreement_signed: "Agreement Signed",
  awaiting_payment: "Awaiting Payment",
  payment_under_review: "Payment Under Review",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export const STATUS_CLASS: Record<BookingStatus, string> = {
  inquiry_received: "bg-champagne-light text-olive",
  approved: "bg-sage-light text-olive",
  agreement_pending: "bg-sand-deep text-olive",
  agreement_signed: "bg-sage-light text-olive",
  awaiting_payment: "bg-terracotta/10 text-terracotta-dark",
  payment_under_review: "bg-terracotta/15 text-terracotta-dark",
  confirmed: "bg-olive text-ivory",
  cancelled: "bg-olive/10 text-olive/60",
};

export const PAYMENT_KIND_LABEL = { deposit: "Deposit", balance: "Remaining balance" } as const;
export type PaymentKind = keyof typeof PAYMENT_KIND_LABEL;

/** Proof-of-payment upload limits (Vercel caps request bodies at 4.5 MB). */
export const PROOF_MAX_BYTES = 4 * 1024 * 1024;
export const PROOF_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"] as const;
export const PROOF_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic";
