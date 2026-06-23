# PatienceAI — AppSumo Submission Kit

Everything you need to submit PatienceAI as a lifetime deal on AppSumo lives in this folder. Treat it as the source of truth for the listing: every asset, copy block, and code batch references this kit.

## Contents

| Path | Purpose |
| --- | --- |
| `appsumo-codes.csv` | 110 pre-generated lifetime redemption codes (Excel-compatible). Upload this directly to AppSumo Vendor portal. |
| `appsumo-codes.sql` | SQL `INSERT` statements — run once against the production DB so `/redeem` recognizes the codes. |
| `scripts/seed-codes.ts` | TypeScript seeder if you need to generate additional batches later. `pnpm exec tsx appsumo-kit/scripts/seed-codes.ts --count 250 --prefix PATIENCE`. |
| `listing-copy.md` | Tagline, short description, long description, "Plans & Features", "Deal Terms". Copy verbatim into the AppSumo submission form. |
| `submission-checklist.md` | The step-by-step checklist Sumo asks for during vendor onboarding. |
| `photos/README.md` | The asset spec — exact dimensions, what to capture, where to place the file. Drop the rendered PNGs into the same folder. |
| `email-templates/` | The customer-facing emails: welcome, redemption help, refund flow. |

## How redemption works in the app

1. AppSumo emails the buyer the code from `appsumo-codes.csv`.
2. Buyer visits `https://<your-domain>/redeem` and pastes the code.
3. The `/redeem` server action checks `AppSumoCode.status === 'AVAILABLE'`. If valid, the code is stashed in `sessionStorage` and the buyer is sent to `/signup?code=…`.
4. `/signup` requires a valid AppSumo code before issuing the OTP — the field is pre-filled.
5. On successful workspace creation, the code row flips to `REDEEMED` with `redeemedBy`, `tenantId`, `tenantSlug`, `redeemedAt`.

A code is **one-time-use**. If a buyer wants two workspaces, they redeem two codes (AppSumo "stacking").

## Operator playbook

- **Add more codes:** run the seed script. Or generate fresh CSV + SQL with the seed script and import.
- **Revoke a code:** `UPDATE appsumo_codes SET status='REVOKED' WHERE code='PATIENCE-XXXX-XXXX-XXXX';`
- **Refund:** AppSumo handles billing. After a refund, revoke the code and (if redeemed) suspend the tenant with `UPDATE tenants SET status='suspended' WHERE id='…'`.
- **Audit:** `SELECT status, COUNT(*) FROM appsumo_codes GROUP BY status;`

## What still needs human work before submitting

- Replace placeholder hero / dashboard screenshots in `photos/` with real renders against a live workspace (suggested: `harsh-and-co` or a freshly seeded demo tenant).
- Record a 60-90s walkthrough video and place at `photos/walkthrough.mp4` (AppSumo requires it).
- Set the AppSumo redemption deadline on the deal page (suggested: 60 days from launch).
- Configure Brevo for transactional email so welcome credentials actually deliver to buyers.
