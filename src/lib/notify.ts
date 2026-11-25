import "server-only";

/**
 * Optional email alert to the admin when a new request arrives.
 * Requires RESEND_API_KEY, ADMIN_NOTIFICATION_EMAIL and NOTIFICATION_FROM_EMAIL.
 * If they are not set, this does nothing — every request is still saved in
 * the database and visible in the admin dashboard.
 */
export async function notifyAdmin(subject: string, lines: Record<string, unknown>) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!key || !to || !from) return;

  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const rows = Object.entries(lines)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td style="padding:4px 0">${esc(Array.isArray(v) ? v.join(", ") : String(v))}</td></tr>`)
    .join("");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: `[Elsewhere Club] ${subject}`,
        html: `<div style="font-family:system-ui,sans-serif"><h2>${esc(subject)}</h2><table>${rows}</table><p>View it in your admin dashboard.</p></div>`,
      }),
    });
    if (!res.ok) console.error("[notify] Resend error", res.status, await res.text());
  } catch (err) {
    console.error("[notify] failed", err);
  }
}
