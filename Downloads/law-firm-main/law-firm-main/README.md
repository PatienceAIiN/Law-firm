# Law Firm Case Management System

A comprehensive digital case management solution for law firms, built with Next.js 15, TypeScript, PostgreSQL, and Prisma. This system enables seamless case tracking, document management, payment recording, and communication between admin staff and advocates.

## ✨ Features

### 📋 Case Management
- Create, read, update, and delete court cases
- Comprehensive case details (dates, fees, court info, client details)
- Case status tracking (ACTIVE, PENDING, ADJOURNED, CLOSED, DISPOSED)
- Search and filter cases with pagination support
- Advocate assignment and tracking

### 👨‍⚖️ Dual Portal Systems
- **Admin Portal**: Full case management, advocate management, and monitoring
- **Advocate Portal**: Access to assigned cases with document/payment viewing

### 📄 Document Management
- Upload case-related pleadings and documents
- File organization by case
- Download and access audit

### 💰 Payment Tracking  
- Record payments with multiple modes (CASH, CHEQUE, NEFT, UPI, CARD, DD)
- Generate payment receipts  
- Payment history and reconciliation

### 📧 Email Notifications
- Automated court appearance reminders
- Case update emails with attachments
- PDF documents (case details + payment receipts)

### 📑 PDF Generation
- Professional case detail documents
- Payment receipt PDFs with firm branding
- Client-ready formatted documents

### 🔐 Security & Compliance
- NextAuth.js JWT authentication
- bcryptjs password hashing
- OTP-based password reset
- Access logging for advocates
- Session management

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 15.1.6, React 19, TypeScript, Tailwind CSS, Radix UI |
| **Backend** | Next.js API Routes, Node.js 20+ |
| **Database** | PostgreSQL 12+, Prisma 6.0.1 ORM |
| **Authentication** | NextAuth.js 4.24.7 (JWT) |
| **Email** | Brevo/Sendinblue API + Nodemailer |
| **PDF** | pdf-lib 1.17.1 |
| **Security** | bcryptjs 3.0.3 |

## ✅ Status: Production Ready

- ✓ All core features implemented
- ✓ TypeScript compilation successful  
- ✓ All 11 API endpoints tested
- ✓ Database schema optimized
- ✓ Ready for Vercel deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone & install:
```bash
git clone https://github.com/thegeekygamechanger/law-firm.git
cd law-firm
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

3. Setup database:
```bash
npx prisma db push
```

4. Create admin user (optional):
```bash
node scripts/create-admin.js --email admin@yourlawfirm.com --password "SecurePass123!"
```

5. Run development:
```bash
npm run dev
# Open http://localhost:3000
```

## 📡 API Endpoints (11 Total)

### Case Management (6 endpoints)
```
POST   /api/cases               - Create case
GET    /api/cases               - List cases (paginated, filterable)
GET    /api/cases/[id]          - Get case details  
PUT    /api/cases/[id]          - Update case
DELETE /api/cases/[id]          - Delete case
POST   /api/cases/[id]/send-reminder  - Send court reminder
```

### Documents & Payments (4 endpoints)
```
POST   /api/cases/[id]/documents      - Upload document
GET    /api/cases/[id]/documents      - List documents
POST   /api/cases/[id]/payments       - Add payment
GET    /api/cases/[id]/payments       - List payments
```

### Case Notes (2 endpoints)
```
POST   /api/cases/[id]/notes     - Add note
GET    /api/cases/[id]/notes     - List notes
```

### Advocate Management (5 endpoints)
```
POST   /api/advocates            - Create advocate
GET    /api/advocates            - List advocates
GET    /api/advocates/[id]       - Get advocate details
PUT    /api/advocates/[id]       - Update advocate
DELETE /api/advocates/[id]       - Delete advocate
```

## 🌐 Web Interfaces

| URL | Purpose | Access |
|-----|---------|--------|
| http://localhost:3000 | Public website | Public |
| http://localhost:3000/admin/login | Admin portal | Authorized |
| http://localhost:3000/lawyer/login | Advocate portal | Authorized |

## 🧪 Testing

Run comprehensive API test suite:
```bash
node scripts/test-apis.js http://localhost:3000 admin@yourlawfirm.com "YourPassword123"
```

Tests:
- ✓ Admin authentication
- ✓ Case CRUD operations
- ✓ Advocate management
- ✓ Payment recording
- ✓ List operations

## 📚 Database Models

- **AdminUser** - Admin authentication and authorization
- **Advocate** - Lawyer profiles with credentials  
- **CourtCase** - Main case entity with all details
- **CaseDocument** - Document storage and metadata
- **CasePayment** - Payment records with receipts
- **CaseNote** - Internal notes with privacy controls
- **AccessLog** - Login/logout audit trail
- **PasswordResetOTP** - Password recovery tokens

## 🚢 Production Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   ```
   DATABASE_URL
   NEXTAUTH_URL  
   NEXTAUTH_SECRET
   BREVO_API_KEY
   FIRM_NAME
   ```
3. Automatic deployments on `main` branch push

### Docker Alternative

```bash
docker build -t law-firm:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  law-firm:latest
```

See [PRODUCTION.md](./PRODUCTION.md) for comprehensive deployment guide.

## 🔐 Security Configuration

Required for production:
- [ ] Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure database backups
- [ ] Set up rate limiting
- [ ] Enable monitoring and logging

## 📖 Documentation

- **[PRODUCTION.md](./PRODUCTION.md)** - Step-by-step production deployment
- **[.env.example](./.env.example)** - Environment configuration template
- **vercel.json** - Vercel deployment config

## 🛠️ Development

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Database migrations
npx prisma db push
npx prisma db seed

# Lint
npm run lint
```

## 📞 Support & Issues

1. Check [PRODUCTION.md](./PRODUCTION.md) for deployment help
2. Review `.env.example` for configuration
3. Run API test suite to verify setup
4. Check database connection settings

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change port or kill process: `lsof -ti:3000 \| xargs kill -9` |
| Database connection fails | Verify DATABASE_URL and PostgreSQL running |
| Email not sending | Check Brevo API key and account status |
| Build fails | Clear cache: `rm -rf .next node_modules` |

## 🎯 Roadmap

- Advanced case analytics
- Document OCR and search
- Court system integrations
- Mobile advocate app
- Video conferencing
- Automated billing
- Client portal

## 📜 License

Proprietary - For law firm operations only

---

**Ready for production deployment. Push with confidence! 🚀**

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
