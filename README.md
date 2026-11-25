# The Elsewhere Club — website

*Go Places. Find Your People.*

A Next.js + Supabase website for a luxury group-travel club. It sells **complete, curated group trips**, each with a fixed destination, dates, price and itinerary. Customers browse upcoming escapes and request their spot (with an optional flight quote). You approve each request; the traveler then reviews and e-signs a personalised booking agreement, pays the deposit by bank transfer and uploads her proof of payment; you confirm once the money has arrived. It also has a separate flight-quote service, a club waitlist, and a private admin dashboard.

You don't need to know how to code. Follow the steps in order. Each one says exactly what to click.

---

## What's already working

| Area | Status |
|---|---|
| All public pages (Home, Upcoming Trips, Trip details, Flights, How It Works, About, FAQ, Contact, Join, Privacy, Terms) | ✅ Works now |
| Booking form with optional flight quote (destination and dates pre-filled from the trip) | ✅ Works now |
| Forms check what people type and block spam | ✅ Works now |
| Forms **saving** to a database | ⚙️ Needs Supabase (Step 2) |
| Admin dashboard (add/remove trips, dates, prices, photos, itineraries, availability, inquiries, flights, waitlist, CSV export) | ⚙️ Needs Supabase (Steps 2–3) |
| Email alert when a request arrives | ⚙️ Optional: Resend (Step 6) |
| Booking system: requests → approval → agreement + e-signature → bank transfer → confirmation | ⚙️ Needs Supabase incl. the service key (Step 2) — starts in **test mode** |
| Emails to travelers (approval link, confirmation with signed agreement + receipt) | ⚙️ Optional: Resend (Step 6), live mode only |
| Card payments | ⛔ Not used — payments are bank transfers you verify yourself |

Until Supabase is connected, the site shows the two **starter trips**: the full **Bali Girls Escape** program (December 7–15, 2026, 9 days / 8 nights in Ubud, Canggu and Uluwatu, **€1,499 / person: 70% deposit €1,049 due December 1, 2026, then 30% €450 due December 6, 2026**) and "Our Next Escape". The forms say plainly that nothing was saved.

---

## Step 0 — Install the tools (one time, about 10 minutes)

1. Install **Node.js LTS** from https://nodejs.org (click the big green "LTS" button and install it).
2. Install **VS Code** from https://code.visualstudio.com. It's a free editor for opening and changing files.
3. Unzip this project somewhere easy to find, such as your Documents folder.

## Step 1 — Run the website on your computer

1. Open VS Code → **File → Open Folder…** → choose the `elsewhere-club` folder.
2. Open the terminal: **Terminal → New Terminal**.
3. Type each line below and press Enter after each one:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 in your browser. 🎉

To stop the site, click in the terminal and press `Ctrl + C`.

## Step 2 — Connect the database (Supabase, free)

> **🔑 Account needed:** Supabase (https://supabase.com). The free plan is enough to start.

1. Sign up at https://supabase.com, then click **New project**.
   - Name: `elsewhere-club`
   - Database password: click **Generate**, then save it in your password manager
   - Region: pick the one closest to most of your customers
2. When the project is ready, open **SQL Editor → New query**.
3. Open `supabase/schema.sql` from this project, copy everything, paste it in, and click **Run**. You should see "Success".
4. Do the same with `supabase/seed.sql`. This loads the two starter trips.
   - *Already ran an older version?* Run `schema.sql` again (it adds the new columns), then `seed.sql`. ⚠️ `seed.sql` **overwrites the two starter trips** with the full Bali program, so any changes you made to them in the dashboard are lost. If your database is from the very first version (it has a `trip_departures` table), run `supabase/reset.sql` first.
5. Go to **Project Settings → API** and copy three values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal"). The booking system needs it so travelers can open their secure links without logging in.
6. In VS Code, duplicate the file `.env.example` and rename the copy to `.env.local`. Paste the three values in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```
7. Stop the site (`Ctrl + C`) and start it again with `npm run dev`.

The forms now save for real, and trips are loaded from your database.

> Never share or upload `.env.local`. It's already excluded from Git.
> The `service_role` key is a master key. It must **never** start with `NEXT_PUBLIC_`, never be pasted into code, and only ever go in `.env.local` and Vercel's environment variables. The website only uses it on the server.

## Step 3 — Create your admin login

1. In Supabase, go to **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up". This stops strangers from creating accounts.
2. Go to **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto Confirm User**.
3. Go to **SQL Editor** and run this, using your own email:
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'you@example.com';
   ```
4. Open http://localhost:3000/admin and sign in.

### What you can do in the dashboard
- **Trips:** add and remove trips, and publish, hide or feature them on the homepage.
- **Dates, price and availability:** set the start and end dates (the duration is calculated for you), the price and currency (shown as "€1,499 / person"; leave the price empty to show "To be confirmed"), the deposit per person and the final balance due date, the group size, and spots available (shown only once you fill it in). You can also set the status:
  - *Registering Interest* → the button says **"Register Your Interest"**
  - *Waitlist Open* → **"Join the Waitlist"**
  - *Booking Requests Open* or *Few Spots Left* → **"Request Your Spot"**
  - *Sold Out* → **"Join the Waitlist"**
- **Inquiry only:** keep this ticked until supplier arrangements, pricing and booking terms are confirmed. The trip page then shows a clear "Inquiry only · not yet bookable" notice.
- **Areas & stays:** for example Ubud (Dec 7–10), Canggu (Dec 10–13) and Uluwatu (Dec 13–15). The days are counted for you (e.g. Dec 7–10 shows as 4 days). These group the itinerary into Part 1/2/3 and draw the route map.
- **Itinerary:** for each day you can set the date, location, title, emoji, photo, short description and overnight stop, then add, edit, reorder or remove activities (time, title, details) and mark any activity as **Optional** or **Extra cost**. Extra-cost activities show an "Optional — Extra Cost" label. Tick "Itinerary is confirmed" to remove the "Provisional" labels. Accommodation and inclusions have the same tick box.
- **Inclusions:** edit "What's included", "Not included" and the note shown underneath (for example about beach club spending). Icons are chosen automatically from the wording.
- **Photos:** upload trip images. The first one becomes the cover, and you can pick a different cover or delete photos.
- **Booking inquiries and flight quotes:** see every request, change its status, and add private notes. If someone asks for flights in the booking form, their request also appears under Flight quotes, with the trip's destination and their chosen dates.
- **Waitlist and members:** see sign-ups. **Export CSV** on each list downloads a spreadsheet.

## Step 4 — Make it yours (edit before launch)

| What | Where |
|---|---|
| Contact email, WhatsApp, Instagram, TikTok | `src/lib/site.ts` |
| Licensed travel operator and ticketing partner (shows "to be appointed" until filled in) | `src/lib/site.ts` → `operator`, `ticketingPartner` |
| Founder story | `src/app/(site)/about/page.tsx` |
| Privacy Policy and Terms (**DRAFTS — have a lawyer review them**) | `src/app/(site)/privacy/page.tsx`, `terms/page.tsx` |
| Colours and fonts | `src/app/globals.css` (top of the file) |
| Trips | The admin dashboard. No code needed. |

### Photos
The site uses photos from your design mockup, enlarged with an AI upscaler (Real-ESRGAN), in `public/images/` so it looks finished. They look good on most screens, but your own original high-resolution photos will always look better. Replace them before launch if you can:
- **Trip photos:** upload them in the admin dashboard. The first photo is the cover.
- **Site photos:** put your own high-resolution photo in `public/images/` **with the same file name**, for example `hero.jpg` for the homepage hero. Landscape photos at least 2000px wide work best.
  - `hero.jpg` homepage hero · `party.jpg`, `wellness.jpg`, `surf.jpg`, `pool.jpg` "Inside the Bali Girls Escape" · `wing.jpg`, `wing-sky.jpg`, `seat.jpg` flights · `beach.jpg` "Join the Club" band · `villa.jpg`, `cocktails.jpg`, `palms.jpg`, `girls-beach.jpg` Bali trip gallery
- Only use photos you own or have a licence for. Get written permission from anyone who can be recognised in a photo.
- Anything without a photo shows a labelled illustrated placeholder.

## Step 5 — Put it online (Vercel, free)

> **🔑 Accounts needed:** GitHub (https://github.com) and Vercel (https://vercel.com).

1. Create a GitHub account. Then install **GitHub Desktop** (https://desktop.github.com), choose **Add → Add existing repository**, and pick this folder. If it asks, choose "create a repository". Then click **Publish repository** and keep it **Private**.
2. Sign in to https://vercel.com with GitHub → **Add New → Project** → import `elsewhere-club`.
3. Before you click Deploy, open **Environment Variables** and add the same values as in your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your live address, for example `https://theelsewhereclub.com` (traveler links in emails use it)
4. Click **Deploy**. In about 2 minutes you'll get a live link.
5. **Custom domain:** in Vercel → Project → **Settings → Domains**, add your domain and follow the DNS instructions.
6. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your live address.

Every time you publish changes from GitHub Desktop, Vercel updates the site automatically.

## Step 6 (optional) — Emails (alerts for you, and booking emails for travelers)

> **🔑 Account needed:** Resend (https://resend.com). The free plan is enough to start.

Every request is always saved in the dashboard. If you also want an email for each one:
1. Create a Resend account and verify your domain (Resend walks you through it).
2. Add these to `.env.local` and to the Vercel environment variables:
   ```
   RESEND_API_KEY=re_...
   ADMIN_NOTIFICATION_EMAIL=you@yourdomain.com
   NOTIFICATION_FROM_EMAIL=Elsewhere Club <bookings@yourdomain.com>
   ```
If these are left blank, emails are simply skipped. Nothing breaks — in the dashboard you'll get each traveler's link to send yourself (for example on WhatsApp).

With email set up **and live mode on**, travelers automatically receive: the approval email with their secure agreement link, a note when their proof of payment arrives, the booking confirmation with their signed agreement and receipt attached (PDFs), and a receipt for the balance.

---

## Step 7 — The booking system (read before your first real booking)

**How it works**
1. **Request Your Spot** — the traveler sends her full legal name, email, phone, country of residence, nationality, date of birth (18+ is checked), number of travelers and requests. The form says clearly that this doesn't guarantee a booking and that no payment is required. The trip page shows the exclusions and the cancellation policy before she submits.
2. **You approve** — in **Admin → Bookings**, open the request, check the suggested reference (e.g. `EC-BALI26-001`), set the deposit deadline (and the final balance deadline), then **Approve & send agreement**. Or decline it.
3. **She signs** — her secure link opens her personalised Trip Booking Agreement (your text): her name and email, the trip, €1,499 total, the first payment (70%, €1,049, due December 1) and the second payment (30%, €450, due December 6), booking conditions and your contact email. She ticks the box, types her legal name, draws her signature and clicks **Sign My Agreement**. She can download a PDF.
4. **Secure Your Spot** — after signing she sees her amount, due date and payment reference, and a **Message us on WhatsApp** button (with the message already written, including her name, reference and amount). You reply with the bank details on WhatsApp. After paying, she uploads a screenshot or PDF of her transfer (max 4 MB) — or sends it on WhatsApp. The page says this doesn't confirm the booking automatically.
5. **You verify** — check your bank account. Only when the money has arrived, tick the confirmation box and click **Confirm payment**. Can't match it? Click **Mark as not matched** with a note, and she can upload again.
6. **Confirmed** — her page shows "You're going to Bali! 🌴" with her reference, dates, payment summary and next steps, and she gets the confirmation email. The remaining balance is tracked separately: she uploads proof again later and you confirm it the same way.

Statuses: Inquiry Received → Approved → Agreement Pending → Agreement Signed → Awaiting Payment → Payment Under Review → Confirmed (or Cancelled).

**Already set up the database before?** Run `supabase/schema.sql` again (safe — it only adds the new booking tables and rules). Then either run `seed.sql` again, or in **Admin → Trips → Bali** set the price to 1499, the first payment to 1049, and the due dates to December 1 and December 6, 2026.

**Before going live — Admin → Booking settings**
- Add your **WhatsApp number** (with country code) — the only thing required to go live. Bank details are optional and never shown on the website; you send them on WhatsApp.
- Optional: your company details (shown on receipts and legal pages; the company email replaces imanehattani0@gmail.com in section 7 of the agreement) and a cancellation table (shown in section 4 if filled in).
- In **Admin → Trips**, check the price, **first payment per person** (€1,049 for Bali) and the **first and second payment due dates**.
- Make a test booking for yourself, open the link, sign, upload a test proof and confirm it. Every test page says "Test mode — do not send money", and test bookings never email anyone.
- When everything is right, tick "I approve this final configuration" and click **Switch live mode on**. Live mode can't be switched on while anything required is missing, and an agreement with gaps can't be sent.

**Good to know**
- **Security:** traveler links are long random secrets, stored only in scrambled (hashed) form, and they expire (14 days by default — change it in settings). **Send a new link** at any time; the old one stops working. Booking pages are hidden from search engines and never leak the link to other websites. Proofs of payment are in a private storage folder that's never public; you open them through 60-second private links.
- **No duplicates:** the same email can't create a second active request for the same trip. Each booking can be signed only once. A payment can be confirmed only once, and the confirmation email goes out only once.
- **Audit history:** every step (request, approval, link, first view, signature with IP address and browser, uploads, payment checks, emails, cancellations) is recorded on the booking page and can't be edited. Signed agreements are stored exactly as signed, with a fingerprint (SHA-256) and can never be changed.
- **Electronic signature:** the built-in signature records intent (tick box + typed legal name + drawn signature), identity (the link sent to her email), the time, IP address, browser, agreement version and a fingerprint of the exact text. Whether that's enough depends on your jurisdiction. Once you've confirmed which law applies, ask your lawyer whether you need a certified e-signature provider (for example Yousign, Dropbox Sign or DocuSign); the signing step is in `src/app/booking-actions.ts` → `signAgreement` if a developer needs to connect one.
- **Changing the contract wording:** edit `src/lib/booking/agreement.ts`, then raise the **Agreement version** in settings (e.g. `v1.1`). Agreements that are already signed keep their original text.
- **More than one traveler:** one request can cover several travelers (the totals are multiplied), and the agreement shows the totals. If your lawyer prefers one agreement per traveler, ask each person to send their own request.
- **Emails replace links:** when the system emails a traveler a new link (live mode, email set up), her old link stops working, so she should always use the newest email. If an email fails, the new link is shown to you on the booking page.
- **The legal pages** (Terms & Conditions, Booking Agreement, Cancellation & Refund Policy, Privacy Policy) are linked in the footer. Terms and Privacy show a marked draft until you paste your final texts in **Booking settings → Legal page texts**.

---

## Honest by design (built in)
- Every trip states **"Flights are not included in the trip price and are quoted separately. All fares are subject to availability and confirmation."**
- Anything not finalised (price, itinerary, accommodation, inclusions, group size) shows **"To be confirmed"** until you change it in the dashboard.
- Trips in **inquiry-only** mode say so clearly, and every form says it creates a booking inquiry, not a confirmed reservation.
- Spots left are shown **only** when you type a number in.
- Group size shows "To be confirmed" until you set it.
- The operator and ticketing partner show "to be appointed" until you fill them in.
- There are no fake reviews, discounts, live fares, airline partnerships or licences.
- Requesting a spot never takes payment, and a booking is confirmed only after the agreement is signed, the money has arrived in your official account and you confirm it.
- Visitors never need an account to browse trips or request a quote.

## Security (what's protecting your customers' data)
- **Database rules (Row Level Security):** the public website can only *read published trips* and *submit new forms*. It can never read customer details, bookings, signed agreements, payments or bank details. Only people listed in `admin_users` can see inquiries, members or messages. This was tested with automated checks.
- The admin pages need a login, and every admin action checks admin permission again on the server.
- Every form is validated on the server and has hidden spam traps (a honeypot field plus a time check).
- There are no passwords or secret keys in the code. Everything lives in environment variables.
- CSV exports are protected against spreadsheet formula tricks, and admin pages are hidden from search engines.
- *Optional upgrade:* if spam ever becomes a problem, add Cloudflare Turnstile (free) to the forms.

## Payments
Payments are bank transfers to the account in **Booking settings**, which you verify by hand. There's no card checkout. Nothing is real until you switch on live mode, and the bank details are never shown on the website — you send them to each traveler on WhatsApp after she signs.

## For developers
- Stack: Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Zod.
- `src/app/(site)` holds the public pages, `src/app/admin` holds the dashboard, and `src/app/actions.ts` holds the public form actions.
- `src/lib/trips.ts` loads trips from the database, or uses the sample trips when Supabase isn't set up.
- `src/proxy.ts` protects `/admin`. (Next 16 calls this "proxy"; older versions called it "middleware".)
- Booking system: `src/lib/booking/*` (agreement template, PDFs, emails, secure links, settings), traveler pages in `src/app/(site)/booking/[token]`, traveler actions in `src/app/booking-actions.ts`, admin actions in `src/app/admin/booking-actions.ts`, admin pages in `src/app/admin/(dashboard)/bookings` and `/settings`.
- To regenerate `supabase/seed.sql` after editing the sample trips, run `node scripts/make-seed.mjs`.
- Commands: `npm run dev` · `npm run build` · `npm run lint` (type check).
