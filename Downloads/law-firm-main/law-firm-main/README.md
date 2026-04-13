# Law Firm Website — Full-Stack CMS

A production-ready, fully headless law firm CMS built with Next.js 15, Prisma ORM, PostgreSQL, Brevo email, and AI-powered legal chatbot. Every piece of text, layout, and configuration is managed from the admin panel — zero hardcoding.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| Email | Brevo (Sendinblue) SMTP API |
| AI / Chat | Groq LLM + RAG |
| Meetings | Google Meet OAuth + Zoom OAuth |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)/          # Public-facing pages (Home, About, Blog, etc.)
│   ├── admin/                # Admin panel (protected)
│   │   └── (authenticated)/  # Settings, Testimonials, Team, Blog, etc.
│   └── api/                  # REST API routes
├── components/
│   ├── admin/                # Admin UI components
│   ├── layout/               # Header, Footer, MarketingShell
│   ├── sections/             # Homepage sections
│   └── ui/                   # Shared primitives
├── lib/                      # Utilities, email, auth, prisma, RAG
└── types/                    # TypeScript definitions

prisma/
└── schema.prisma             # Database schema (13 models)
```

---

## Environment Variables

Create `.env.local` in the project root. **All variables marked `REQUIRED` must be set for production.**

### Database
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
# REQUIRED. PostgreSQL connection string.
# Local: postgresql://postgres:password@localhost:5432/postgres?schema=public
# Railway/Render/Supabase: use the provided connection string
```

### Authentication
```env
NEXTAUTH_URL="https://yourdomain.com"
# REQUIRED. Full URL of your deployment (no trailing slash).

NEXTAUTH_SECRET="a-random-32-char-secret"
# REQUIRED. Generate with: openssl rand -base64 32
```

### Email — Brevo (Required for consultation/testimonial emails)
```env
BREVO_API_KEY="xkeysib-..."
# REQUIRED for email. Get from app.brevo.com → SMTP & API → API Keys

BREVO_SENDER_EMAIL="noreply@yourdomain.com"
# REQUIRED. Must be a verified sender in your Brevo account.

BREVO_SENDER_NAME="Your Firm Name"
# REQUIRED. Display name shown in sent emails.
```

### AI Chatbot
```env
GROQ_API_KEY="gsk_..."
# REQUIRED for AI chatbot. Get from console.groq.com
```

### Google Meet OAuth (Optional — for auto meeting link generation)
```env
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
# Setup: Google Cloud Console → APIs & Services → OAuth 2.0 Client (Web App)
# Enable: Google Calendar API
# Redirect URI: https://yourdomain.com/api/auth/google-meet/callback
```

### Zoom OAuth (Optional — for auto meeting link generation)
```env
ZOOM_CLIENT_ID="abc123"
ZOOM_CLIENT_SECRET="xyz789"
# Setup: Zoom Marketplace → Build App → OAuth
# Redirect URL: https://yourdomain.com/api/auth/zoom/callback
# Scopes: meeting:write:admin, user:read:admin
```

### App URL (used in email links)
```env
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
# REQUIRED for email links (testimonial request URLs, booking confirmations).
```

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up .env.local (copy from .env.example and fill values)
cp .env.example .env.local

# 3. Push database schema
DATABASE_URL="postgresql://..." npm run db:push

# 4. (Optional) Seed initial admin user
npm run db:seed

# 5. Run dev server
npm run dev
```

Open http://localhost:3000. Admin panel at http://localhost:3000/admin/login.

Default admin credentials (after seed): `admin@lawfirm.com` / `admin123` — **change immediately**.

---

## Production Deployment

### Build
```bash
npm run build
npm run start
```

### Railway / Render / Vercel
1. Add all env vars in the platform dashboard
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Run migration on first deploy: `DATABASE_URL=... npx prisma db push`

---

## Admin Panel — Feature Guide

Access at `/admin/login`.

### Settings (`/admin/settings`)

| Tab | What you can change |
|-----|-------------------|
| Design & Theme | Primary/accent colors, fonts, logo image, favicon |
| Hero Section | Badge text, headline, subtitle, CTA button labels and links, hero image |
| Branding | Logo initials, firm short name, firm full name |
| Navigation | Add/remove/reorder navbar links |
| Site Metrics | Trust indicators shown on homepage (e.g. "25+ Years", "1500+ Clients") |
| Footer & Legal | Description, legal disclaimer, quick links, office hours |
| **Pages & Content** | Every label, heading, subtitle, CTA on every page — Visual Editor OR Raw JSON |
| Meeting Controls | Storage mode, auto-recording rules, virtual meeting defaults |
| Admin Users | Create, update, delete admin accounts |

### Pages & Content Tab — Two Modes

**Visual Editor** (recommended for non-technical users):
- Accordion sections per page (Home, About, Contact, Consultation)
- Input fields for every text value — click a section to expand, edit, click Save

**Raw JSON** (for developers):
- Edit the full content JSON directly
- Changes in Visual Editor are reflected here live

Changes take effect without page reload on the admin side (router.refresh()). Public site updates within ~5 minutes (ISR cache) or instantly on hard refresh.

### Testimonials (`/admin/testimonials`)

**Send Review Request:**
1. Enter client name and email in the form at the top
2. Click "Send Request" — client receives a unique email link
3. Client clicks link, fills their name/role/review/rating
4. Request status changes from "Sent" → "Response Received"
5. Admin sees the review, clicks "Approve & Publish" → appears on the public site
6. Or click "Reject" to decline

**Per-request actions:**
- **Resend** — re-send the email link (available for Sent and Rejected statuses)
- **Delete** — permanently remove the request record

**Published Testimonials:**
- Edit any testimonial (name, role, text, rating, active/inactive)
- Delete a testimonial (removes from public site instantly)
- Search by name or content

### Blogs (`/admin/blogs`)
- Create/edit/delete blog posts with rich text (TipTap editor)
- Slug auto-generated from title
- Draft/Published toggle
- Cover image upload

### Practice Areas (`/admin/practice-areas`)
- CRUD for all practice areas
- Icon picker (Lucide icons)
- Rich text content editor
- Active/inactive toggle

### Team (`/admin/team`)
- Add/edit/remove team members
- Profile image upload
- Expertise, education, contact details

### Availability (`/admin/availability`)
- Set available consultation days/time slots
- Set slot capacity
- Enable/disable per slot
- Synced to public booking form in real-time

### Inbox (`/admin/inbox`)
- View contact form submissions
- View consultation booking requests
- Mark as read/resolved

### Integrations (`/admin/integrations`)
- Connect Google Meet (one-click OAuth)
- Connect Zoom (one-click OAuth)
- Used to auto-generate meeting links for virtual consultations

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chat` | POST | None | Send AI chat message |
| `/api/chat` | GET | None | Get chat history by session |
| `/api/chat` | DELETE | None | Clear chat session |
| `/api/consultation/availability` | GET | None | Get slots for a date |
| `/api/consultation/availability/month` | GET | None | Get slots for a month |
| `/api/testimonial-request` | POST | Admin session | Send testimonial email to client |
| `/api/testimonial-request` | GET | None | Fetch pending request by token |
| `/api/testimonial-request` | PATCH | None | Submit testimonial form (client) |
| `/api/admin/availability` | GET | Admin | List availability slots |
| `/api/admin/availability` | POST | Admin | Create availability slot |
| `/api/admin/availability/[slotId]` | PATCH | Admin | Update slot |
| `/api/admin/availability/[slotId]` | DELETE | Admin | Delete slot |
| `/api/admin/upload` | POST | Admin | Upload image (max 5MB, JPEG/PNG/WebP/GIF) |
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth handler |
| `/api/auth/google-meet/connect` | GET | Admin | Start Google OAuth |
| `/api/auth/google-meet/callback` | GET | — | Google OAuth callback |
| `/api/auth/google-meet/disconnect` | POST | Admin | Disconnect Google Meet |
| `/api/auth/zoom/connect` | GET | Admin | Start Zoom OAuth |
| `/api/auth/zoom/callback` | GET | — | Zoom OAuth callback |
| `/api/auth/zoom/disconnect` | POST | Admin | Disconnect Zoom |
| `/api/meeting-recordings` | POST | — | Upload meeting recording |

---

## Database Models

| Model | Purpose |
|-------|---------|
| `AdminUser` | Admin panel accounts |
| `SiteSetting` | Key-value store for all site config (hero, brand, nav, etc.) |
| `SiteMetric` | Homepage trust indicator numbers |
| `AboutProfile` | Firm profile, social links, office details |
| `BlogPost` | Blog articles with rich content and SEO fields |
| `PracticeArea` | Legal service areas with description and icon |
| `TeamMember` | Staff profiles |
| `Testimonial` | Published client reviews |
| `TestimonialRequest` | Testimonial email request lifecycle (PENDING → SUBMITTED → APPROVED/REJECTED) |
| `Faq` | FAQ entries |
| `ContactSubmission` | Contact form submissions |
| `ConsultationBooking` | Booking requests linked to availability slots |
| `AvailabilityDay` + `AvailabilitySlot` | Consultation calendar |
| `ChatConversation` | AI chat session storage |

---

## Email System

All emails use **Brevo (Sendinblue)** SMTP API. Configure `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.

| Email | When sent | To |
|-------|----------|----|
| Contact form confirmation | Client submits contact form | Client |
| Booking confirmation | Consultation slot booked | Client |
| Booking notification | New booking received | Admin |
| Slot-full summary | Slot reaches capacity | Admin |
| Testimonial request | Admin clicks "Send Request" | Client |

---

## Instant Sync (No Hard Refresh)

Admin changes call `router.refresh()` after each server action, which re-fetches server component data. Public pages use Next.js ISR with a 5-minute revalidation window (`revalidatePath` triggers immediate cache bust).

---

## Security Notes

- Admin routes are protected by NextAuth middleware
- Testimonial request tokens are UUID-based, single-use
- File uploads are validated for type and size server-side
- Passwords are hashed with bcrypt (salt rounds = 12)
- All DB queries use Prisma parameterized queries (no SQL injection risk)
- Sensitive env vars are never exposed to the client bundle

---

## Should You Push to Production?

### Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `NEXTAUTH_SECRET` is a strong random value (not the dev one)
- [ ] `NEXTAUTH_URL` is set to your live domain
- [ ] `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` are configured
- [ ] `GROQ_API_KEY` is set (for AI chatbot)
- [ ] `NEXT_PUBLIC_APP_URL` matches `NEXTAUTH_URL`
- [ ] Run `prisma db push` on the production database
- [ ] Change the default admin password immediately after first login
- [ ] Set up a verified sender domain in Brevo (avoid spam folders)
- [ ] (Optional) Configure Google/Zoom OAuth redirect URIs to your live domain

Once all above are checked — **yes, push to production**.
