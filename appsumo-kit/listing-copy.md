# PatienceAI — AppSumo Listing Copy

## Tagline (max 60 chars)
> The AI-powered command center for solo lawyers & small firms.

## Short description (max 160 chars)
> Run your law practice end-to-end — cases, clients, billing, video consults, branded site, and an AI legal assistant — from one tenant-isolated workspace.

## Hero subheadline
PatienceAI replaces six tools (CRM + intake + scheduling + receipts + website + AI assistant) with one workspace built specifically for advocates. Each firm gets an isolated tenant at `yourdomain.com/team/<your-slug>`, branded the way you want, with everything from inquiries to invoices in one place.

## Long description

Most legal tech is built for 500-lawyer firms. PatienceAI is the opposite — a single workspace a solo advocate (or a 3-10 lawyer firm) can run their entire practice on without paying for nine SaaS subscriptions.

**Built for the way Indian law firms actually work:**
- Per-workspace branded public site with your logo, colors, and pages
- Inquiry intake, OTP-verified client consultations, and slot-based bookings
- In-person OR video (LiveKit) consults — your address is set once, the client never has to enter it
- Per-case file vault, receipts (with optional PDF email to client), and a lawyer portal
- Built-in **LawAI** assistant — tenant-aware, so it answers from your workspace's data only
- Admin + lawyer portals with role-based access; super-admin for multi-firm operators

**Why a lifetime deal?** PatienceAI is positioned at solo and emerging practices. The lifetime tier removes the "is it worth the monthly fee" hesitation and lets a new advocate set up their entire digital infrastructure in one weekend, once.

## Plans & features (single-tier lifetime)

- Unlimited cases, clients, receipts
- Up to 10 lawyer seats per workspace
- Unlimited public-site visitors
- Custom domain mapping (CNAME) included
- LawAI assistant — unlimited messages, tenant-scoped knowledge
- Video consultations via LiveKit (60 min/session)
- Branded transactional emails via your Brevo / SMTP keys
- All future PatienceAI features under the "Legal Workspace" line

## Deal terms

- One code = one workspace, lifetime access
- Codes are non-transferable once redeemed
- 60-day money-back guarantee, refunded directly by AppSumo
- 60-day redemption window from purchase
- Stacking supported — a buyer can redeem multiple codes for multiple workspaces

## FAQ

**Is my data isolated from other firms on PatienceAI?**
Yes. Every model has a `tenantId` foreign key and every server-side query is scoped to it. Auth cookies are separate per tenant. There is no cross-tenant read path.

**Can I bring my own domain?**
Yes, point a CNAME at our app domain and we map it during onboarding.

**Do you store client documents?**
Yes, with per-tenant Cloudinary / R2 buckets and signed URLs.

**What happens after the redemption window?**
Codes that aren't redeemed in 60 days expire. Your workspace, once activated, is yours for life.
