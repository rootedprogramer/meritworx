# MeritWorx: Phase 1 (Foundation)

What's built: Browse, company profiles, How levels work, a homeowner waitlist, a
"For companies" sales page with an invitation request form, invite-link sign-up for companies
(with private license and insurance uploads), a company home with 30-day profile views, a level card,
a share card, and profile editing, plus admin Approvals, Invite, Companies (level override with a
required reason, pause and restore), Waitlist (with CSV export), and Settings.

Every rule is enforced in the database, not only hidden in the UI: row-level security,
owner-only fields, insurance required before approval, level changes need a written reason,
and an audit log of every change.

Specials, Requests, and Payments tabs show "coming soon" screens. Those are Phases 2 to 6.

## Deploy (about 30 minutes)

1. Supabase: create a new project. Open SQL Editor, paste `supabase/schema.sql`, and run it.
   Optional for sales demos: run `supabase/sample-companies.sql`. Delete those companies before launch.
2. Supabase → Authentication → Providers: turn on Email. Under Email Templates → Magic Link, put
   `{{ .Token }}` in the template so people get a 6-digit code. Text-code login works once you add
   Twilio under Providers → Phone; until then, use "Email me".
3. GitHub: create a private repo (in the app company's name), then push this folder:
   `git init && git add . && git commit -m "MeritWorx phase 1" && git branch -M main && git remote add origin <repo-url> && git push -u origin main`
4. Netlify: Add new site → Import from GitHub → pick the repo. The build settings come from `netlify.toml`.
   Under Site configuration → Environment variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API). Redeploy.
5. Supabase → Authentication → URL Configuration: set Site URL to your Netlify address.
6. Sign in on the live site with your email and your mom's, then run this in SQL Editor:
   `update users set role = 'admin' where email in ('you@...', 'mom@...');`

## Inviting a company

Admin → Approvals → Invite a company creates a link. Text or email it to the owner. They sign in,
apply, and upload their license and insurance certificate. In Approvals, enter the rating and review
count from your own vetting, check the license, mark the insurance received, pick the starting level,
then click Approve and go live.

## Where things live

- `src/lib/types.ts`: `VETTING_LINE` is the "checked by" text on profiles.
- `src/styles.css`: the spec's colors, fonts, and corner sizes.
- `src/components/Level.tsx`: the placeholder merit seal. Swap it for the final badge art.
