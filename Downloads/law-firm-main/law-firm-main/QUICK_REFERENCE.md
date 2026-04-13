# Quick Reference - Case Management System

## 🚀 Getting Started (5 mins)

```bash
# 1. Update env
cp .env.local .env  # For Prisma

# 2. Initialize DB
npx prisma db push

# 3. Start dev server
npm run dev
```

## 📍 Key URLs

### Admin
- **Login**: `http://localhost:3000/admin/login`
- **Dashboard**: `http://localhost:3000/admin/dashboard`
- **Cases**: `http://localhost:3000/admin/cases`

### Advocate
- **Login**: `http://localhost:3000/lawyer/login`
- **Dashboard**: `http://localhost:3000/lawyer/dashboard`
- **Cases**: `http://localhost:3000/lawyer/cases`

## 🔐 Authentication

### Admin
- Uses: `next-auth/credentials`
- Config: `src/lib/auth.ts`
- Route: `/api/auth/[...nextauth]`
- DB Table: `admin_users`

### Advocate
- Uses: `next-auth/credentials`
- Config: `src/lib/advocate-auth.ts`
- Route: `/api/auth/advocate/[...nextauth]`
- DB Table: `advocates`

**Key Difference**: Separate NextAuth instances for role-based access

## 📦 API Structure

### Cases (`/src/app/api/cases/`)
```
route.ts              → GET /api/cases, POST /api/cases
[id]/route.ts         → GET, PUT, DELETE /api/cases/[id]
[id]/documents/route.ts → GET, POST documents
[id]/payments/route.ts  → GET, POST payments
[id]/notes/route.ts     → GET, POST notes
[id]/send-reminder/route.ts → POST send email
```

### Advocates (`/src/app/api/advocates/`)
```
route.ts              → GET /api/advocates, POST /api/advocates
[id]/route.ts         → GET, PUT, DELETE /api/advocates/[id]
```

## 🗄️ Database Schema

```
Advocate
├── id (primary key)
├── email (unique)
├── name, title, phone
├── isActive (boolean)
├── cases (relationship)
└── accessLogs (relationship)

CourtCase
├── id (primary key)
├── caseNumber (case identifier)
├── status (ACTIVE|CLOSED|DISPOSED|PENDING|ADJOURNED)
├── advocateId (FK → Advocate)
├── nextHearingDate
├── documents (relationship)
├── payments (relationship)
└── notes (relationship)

AccessLog
├── advocateId (FK)
├── loginTime
└── logoutTime

CaseNote
├── advocateId (FK)
├── caseId (FK)
├── content (text)
└── isPrivate (boolean)
```

## 💡 Common Tasks

### Create Advocate via API
```bash
POST /api/advocates
{
  "name": "Adv. Name",
  "email": "adv@example.com",
  "password": "Secure123!",
  "title": "Senior Advocate"
}
```

### Create Case via API
```bash
POST /api/cases
{
  "caseNumber": "CS/001/2024",
  "title": "Case Title",
  "clientName": "Client Name",
  "clientEmail": "client@example.com",
  "court": "District Court",
  "caseType": "Civil",
  "advocateId": "uuid-of-advocate"
}
```

### Upload Document
```bash
POST /api/cases/[caseId]/documents
{
  "name": "Document Title",
  "fileUrl": "/path/to/file.pdf",
  "fileSize": 1024
}
```

### Add Payment
```bash
POST /api/cases/[caseId]/payments
{
  "amount": 5000,
  "mode": "NEFT",
  "paymentDate": "2024-01-15",
  "reference": "REF123"
}
```

### Send Court Reminder
```bash
POST /api/cases/[caseId]/send-reminder
```
Automatically sends email to client with:
- Court details
- Hearing date
- Advocate info
- Optional: Fee details

## 🎯 Admin Workflow

1. **Create Case**: Admin → `/admin/cases/new` → Fill form
2. **Assign to Advocate**: Select advocate when creating case
3. **Add Documents**: Case detail → "Upload Document" button
4. **Record Payment**: Case detail → "Add Payment" button
5. **Send Reminder**: Case detail → "Send Reminder" button
   - Email goes to: `courtCase.clientEmail`
   - Content depends on: `emailControl` field

## ⚖️ Advocate Workflow

1. **Login**: `/lawyer/login` (email + password)
2. **View Dashboard**: See assigned cases + statistics
3. **View Case**: Click case in list
4. **See Full Info**: Case details, documents, payments, notes
5. **Track Hearing**: Dashboard shows upcoming dates

## 🔑 Key Fields Explained

### Case Status
- `ACTIVE`: Ongoing case
- `PENDING`: Awaiting hearing
- `ADJOURNED`: Postponed to next date
- `CLOSED`: Case completed
- `DISPOSED`: Case dismissed

### Email Control
- `NONE`: No email to client
- `BILL_ONLY`: Send only fee details
- `DETAILS_ONLY`: Send only case details
- `BOTH`: Send both fee details and case details

### Access Control
- Advocates can only see their assigned cases
- Checked in case detail API: `if (courtCase.advocateId !== session.user.id)`
- Admin can see all cases

## 📧 Email Integration

**Function**: `src/lib/email.ts` → `sendEmail()`

**Required Env**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password
EMAIL_FROM=noreply@firm.com
FIRM_NAME=Law Firm Name
```

## 📝 File Paths Quick Lookup

| Component | Path |
|-----------|------|
| Case APIs | `src/app/api/cases/` |
| Advocate APIs | `src/app/api/advocates/` |
| Admin Cases | `src/app/admin/(authenticated)/cases/` |
| Advocate Login | `src/app/lawyer/login/` |
| Advocate Dashboard | `src/app/lawyer/dashboard/` |
| Advocate Cases | `src/app/lawyer/cases/` |
| PDF Gen | `src/lib/case-pdf.ts` |
| Auth Config (Admin) | `src/lib/auth.ts` |
| Auth Config (Advocate) | `src/lib/advocate-auth.ts` |

## 🐛 Debugging

### Check Database
```bash
npx prisma studio
# View all tables and records
```

### Check API Response
```bash
curl http://localhost:3000/api/cases \
  -H "Content-Type: application/json"
```

### Check Auth Config
```bash
# Admin: Check NextAuth session
console.log(session) in `/admin/login`

# Advocate: Check NextAuth session
console.log(session) in `/lawyer/login`
```

### View Logs
```bash
# Terminal shows:
- NextAuth debug info
- API request logs
- Prisma query logs
```

## ✅ Checklist for Production

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure real email service (not Gmail)
- [ ] Set `HTTPS` URLs in NextAuth
- [ ] Database backups enabled
- [ ] Environment variables secured
- [ ] User passwords hashed (bcryptjs)
- [ ] API rate limiting
- [ ] Activity logging enabled
- [ ] Error monitoring (Sentry, etc.)
- [ ] User onboarding docs written

## 📱 Response Formats

### List Cases
```json
{
  "cases": [{...}],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Get Case
```json
{
  "id": "uuid",
  "caseNumber": "CS/001/2024",
  "advocate": {
    "id": "uuid",
    "name": "Advocate Name",
    "email": "adv@example.com"
  },
  "documents": [{...}],
  "payments": [{...}],
  "notes": [{...}]
}
```

## 🎓 Learning Path

1. **Understand**: Read `CASE_MANAGEMENT_SETUP.md`
2. **Explore**: Run `npx prisma studio` to view database
3. **Test**: Create advocate and case via API
4. **Build**: Add new features to the system
5. **Deploy**: Apply to production environment
