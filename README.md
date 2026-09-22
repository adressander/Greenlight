# Greenlight — MVP

A working reminder dashboard for trucking compliance deadlines (UCR, IFTA,
IRP, insurance, DOT medical cards). Built to get in front of a test market
fast — no billing yet, free tier only, real accounts and real SMS.

## What's actually in here

- **Signup/login** — email + password (Supabase Auth). Sign-up confirmation
  and password reset both use a 6-digit code typed into the app, not a
  clickable link — some mail providers (Outlook/Microsoft 365 in
  particular) silently pre-fetch and burn one-time links before the user
  ever opens them, so codes are the reliable choice here.
- **Dashboard** — add a truck, set its deadline dates, see color-coded
  status (green until 60 days out, yellow until 15, red inside 15), mark
  things renewed.
- **Settings** — business info, multiple SMS alert phone numbers (every
  number gets every alert), and a per-account reminder schedule override
  (defaults to the app-wide schedule below).
- **Real SMS alerts** — a daily cron job checks every deadline and texts
  every alert phone on the account once at 90 / 60 / 30 / 15 days out
  by default, then every day starting 5 days out (including after the
  deadline passes) via Twilio.
- **Database with proper access control** — Supabase Postgres with Row
  Level Security, so users can only ever see their own trucks.

What's **not** in here yet, on purpose — you don't need it to validate
demand: payments/Stripe, a paid tier, multi-driver accounts, admin/analytics.
Add these once people are actually using the free version.

## One-time setup (about 30–45 minutes)

### 1. Supabase (auth + database) — free tier is enough
1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run everything in `supabase/schema.sql`.
3. Go to Authentication → Providers → make sure **Email** is enabled. Under
   Authentication → Emails → Templates, edit **Confirm signup** and **Reset
   Password** to use `{{ .Token }}` (a 6-digit code) instead of the default
   `{{ .ConfirmationURL }}` link.
4. Copy your **Project URL**, **anon public key**, and **service_role key**
   from Project Settings → API. You'll need all three.

### 2. Twilio (SMS) — optional for the very first test, needed to actually text people
1. Create a trial account at [twilio.com](https://twilio.com) and buy a
   phone number (a few dollars).
2. Copy your **Account SID**, **Auth Token**, and the **phone number** you
   bought.
3. Note: Twilio trial accounts can only text verified numbers. Fine for
   testing with yourself and a few friendly early users; upgrade the
   account before a real pilot with strangers.

### 3. Deploy to Vercel (free tier is enough)
1. Push this folder to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add all the variables from `.env.example` under Project Settings →
   Environment Variables (paste in your real Supabase/Twilio values).
4. Deploy. Vercel will pick up `vercel.json` automatically and run the
   `/api/check-deadlines` cron job once a day (currently set to noon UTC —
   change the schedule string in `vercel.json` if you want a different time).
5. Go back to Supabase's URL Configuration and update the site URL/redirect
   to your real `https://your-app.vercel.app` domain.

That's it — the app is live. Share the Vercel URL with your first test
users.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```

## Testing the cron job manually

You don't have to wait for the daily schedule while testing:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/check-deadlines
```

It returns how many deadlines it checked and how many alerts it sent.

## Known limitations to fix before scaling past a pilot

- **Dependencies**: this uses Next.js 14. Before a real launch, upgrade to
  the latest Next.js major version and run `npm audit fix` — several
  advisories affect self-hosted Next apps at scale (less relevant on
  Vercel's managed infrastructure, but worth closing before you depend on
  this for revenue).
- **No billing yet.** Once you see real usage, add Stripe for the paid
  SMS/multi-truck tier described in the original pricing plan.
- **No admin visibility.** You'll want a simple way to see all signups and
  usage — even just a Supabase Table Editor view — to know if this is
  working.
- **Legal disclaimer.** Add a visible note that this is a reminder tool,
  not a compliance guarantee, before real users rely on it.
