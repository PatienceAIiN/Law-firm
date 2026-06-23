# AppSumo Submission Checklist

Run through this list in order before clicking "Submit for review" in the Sumo vendor portal.

## 1. Product readiness
- [ ] Production domain serves PatienceAI under HTTPS (Let's Encrypt or platform-managed)
- [ ] `DATABASE_URL` points at Supabase pooler with `pgbouncer=true&connection_limit=5&pool_timeout=20`
- [ ] `DIRECT_URL` is set for migrations
- [ ] `BREVO_API_KEY` is set — verify by signing up a test workspace and confirming the welcome email lands
- [ ] `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` set; video consult flow works in a real browser
- [ ] Cloudinary OR R2 credentials set (no FS-fallback in prod)
- [ ] `NEXTAUTH_URL` matches the production domain
- [ ] `SUPER_ADMIN_EMAILS` populated with founder accounts
- [ ] PWA manifest serves a valid `theme_color` (hex literal, not CSS var)

## 2. Codes & redemption
- [ ] Run the migration so `appsumo_codes` table exists
- [ ] Import `appsumo-codes.sql` (or run `pnpm exec tsx appsumo-kit/scripts/seed-codes.ts`)
- [ ] Verify `/redeem` accepts a real code and routes through to `/signup?code=…`
- [ ] Redeem a test code end-to-end → workspace created → code flips to `REDEEMED`
- [ ] Confirm a redeemed code is rejected on a second attempt
- [ ] Confirm a code with `status='REVOKED'` is rejected

## 3. Public site
- [ ] `/` (root marketing page) loads
- [ ] `/redeem` loads with no console errors
- [ ] Terms (`/terms`) and Privacy (`/privacy`) are written and linked from the footer
- [ ] Contact form in footer modal submits and emails the admin
- [ ] OG image + favicon set
- [ ] Browser tab title is the firm name (no "| something" suffix)

## 4. Assets (in `photos/`)
- [ ] Square logo PNG 512×512 transparent — `photos/logo-square.png`
- [ ] Wide banner 1200×630 — `photos/banner-hero.png` (AppSumo card preview)
- [ ] Dashboard screenshot 1920×1080 — `photos/screenshot-dashboard.png`
- [ ] Lawyer portal screenshot 1920×1080 — `photos/screenshot-lawyer.png`
- [ ] Public site screenshot 1920×1080 — `photos/screenshot-public.png`
- [ ] LawAI assistant screenshot 1920×1080 — `photos/screenshot-lawai.png`
- [ ] Branding panel screenshot 1920×1080 — `photos/screenshot-branding.png`
- [ ] Mobile screenshots 1080×2400 — `photos/mobile-*.png` (at least 3)
- [ ] Walkthrough video 60–90s, 1080p — `photos/walkthrough.mp4`

## 5. Listing copy
- [ ] Tagline pasted (60 char limit)
- [ ] Short description pasted (160 char limit)
- [ ] Long description pasted with formatting preserved
- [ ] Feature bullets entered into the "Features" form (one per line)
- [ ] Deal terms entered verbatim from `listing-copy.md`
- [ ] FAQ entered verbatim

## 6. Support & policies
- [ ] `support@patienceai.in` (or equivalent) inbox is monitored
- [ ] Refund policy linked
- [ ] 60-day redemption deadline configured in the Sumo deal page

## 7. Final smoke test
- [ ] Sign up with `appsumo-codes.csv` row #1 → workspace created
- [ ] Log into the admin panel
- [ ] Upload a logo → favicon updates in browser tab
- [ ] Add a practice area → visible on public site
- [ ] Add a lawyer → activation email arrives
- [ ] Send an inquiry from the public site → admin notified
- [ ] Book a consultation → confirmation email arrives
- [ ] Open LawAI → it answers from the tenant context
- [ ] Mark row #1 as redeemed by checking `SELECT status FROM appsumo_codes WHERE code = '…'`
