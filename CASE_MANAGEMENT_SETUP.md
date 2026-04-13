# Law Firm Digital Case Management System - Setup and Usage Guide

## System Overview

This comprehensive case management system digitizes the law firm's manual court case processes, enabling seamless case tracking, document management, payment tracking, and advocate-client communication. The system is built on Next.js with PostgreSQL database and includes both Admin and Lawyer portals.

## Features Implemented

### ✅ Core Case Management
- **Full CRUD Operations**: Create, read, update, delete court cases
- **Advanced Filtering**: Search by case number, title, client, or court
- **Case Status Tracking**: ACTIVE, CLOSED, DISPOSED, PENDING, ADJOURNED
- **Multi-field Support**: 
  - Case type (Civil, Criminal, Family, Property, Labour, etc.)
  - Court details with judge information
  - Client contact information
  - Opposing party tracking
  - Filing and hearing dates

### ✅ Admin Case Management Dashboard
**Location**: `/admin/cases`

Features:
- Dashboard with key metrics (Total, Active, Upcoming, Urgent cases)
- Case list with status badges and quick filters
- Case detail popup with full information
- Send court appearance reminders to clients via email
- Manage case documents and payments

### ✅ Advocate Portal (Lawyer)
**Location**: `/lawyer/login`

Sections:
- **Dashboard** (`/lawyer/dashboard`): Quick overview of assigned cases
- **My Cases** (`/lawyer/cases`): Complete list of assigned cases with filters
- **Case Details** (`/lawyer/cases/[id]`): Full case information with documents, payments, notes
- **Profile Management** (to be created): Edit own profile
- **Availability** (to be created): Set consultation availability

### ✅ Document Management
- Upload case-related documents (PDFs, images)
- Organize by case
- Track upload dates
- Download capability

### ✅ Payment Tracking
- Record payments with multiple modes (CASH, CHEQUE, NEFT, UPI, CARD)
- Track payment dates and references
- Generate payment receipts in PDF format
- Calculate total fees per case

### ✅ Court Appearance Reminders
- Automated email notifications to clients
- Include case details and hearing date
- Optional: Include fee details and payment receipts
- Configurable email content

### ✅ Case Notes
- Internal notes for case tracking
- Private notes (visible only to advocates)
- Attribution with timestamp
- Thread view for case history

### ✅ Advocate Authentication
Separate login for advocates/lawyers
- `/lawyer/login` - Advocate login page
- Tracks login/logout activity via AccessLog
- JWT-based authentication
- Protected advocate dashboard

### ✅ Admin Features
- **Password Reset**: Via OTP sent to registered email
- **Advocate Management**: Create, update, delete advocate accounts
- **Case Assignment**: Assign cases to specific advocates
- **Email Notifications**: Send reminders and receipts to clients

## Database Schema

### Key Tables
- `admin_users`: Admin login credentials
- `advocates`: Individual advocate profiles with login
- `court_cases`: Case information with advocate assignment
- `case_documents`: Document storage references
- `case_payments`: Payment records with modes
- `case_notes`: Internal case notes
- `access_logs`: Advocate login/logout tracking
- `password_reset_otps`: For admin password recovery

## Setup Instructions

### 1. Environment Configuration

Create a `.env` or `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/law_firm?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourfirm.com
FIRM_NAME="Your Law Firm Name"

# API Keys
GROQ_API_KEY=your-groq-key
```

### 2. Database Initialization

```bash
# Apply migrations
npx prisma db push

# Generate Prisma client
npx prisma generate

# Optionally seed test data
npx prisma db seed
```

### 3. Create First Admin User

Access database directly or create via API:

```sql
INSERT INTO admin_users (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'clxx...', 
  'admin@yourfirm.com', 
  'Admin Name', 
  '$2a$12$...', -- bcrypt hashed password
  'admin',
  NOW(),
  NOW()
);
```

### 4. Create Advocates

Via Admin Panel API:
```bash
POST /api/advocates
{
  "name": "Adv. John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "title": "Senior Advocate",
  "phone": "+91-9999999999"
}
```

### 5. Start Development Server

```bash
npm run dev
```

## Usage Workflows

### Admin Workflow: Managing Court Cases

1. **Access Dashboard**
   - Go to `/admin/cases`
   - View statistics and case list

2. **Create New Case**
   - Click "Add New Case" button
   - Fill in case details
   - Assign to an advocate
   - Set hearing dates

3. **Manage Case Details**
   - Upload documents
   - Record payments
   - Add case notes
   - Update hearing dates

4. **Send Reminders**
   - View case details
   - Click "Send Reminder"
   - Client receives email with hearing date and fees

5. **Track Progress**
   - Filter by status (ACTIVE, ADJOURNED, etc.)
   - Sort by hearing date
   - Identify urgent cases (hearing within 7 days)

### Advocate Workflow: Manage Assigned Cases

1. **Login to Portal**
   - Go to `/lawyer/login`
   - Enter email and password
   - Redirected to dashboard

2. **View Dashboard**
   - See statistics: Active cases, Upcoming hearings
   - Quick access to all cases
   - View access log

3. **Access Case Details**
   - Click on any case
   - View full case information
   - Access client details and payment history
   - Download documents
   - Read internal notes

4. **Track Hearings**
   - Dashboard shows upcoming hearings
   - Visual indicator for cases hearing within 7 days
   - Date countdown

## API Endpoints Summary

### Cases Management
```
GET    /api/cases                      - List all cases
POST   /api/cases                      - Create new case
GET    /api/cases/[id]                 - Get case details
PUT    /api/cases/[id]                 - Update case
DELETE /api/cases/[id]                 - Delete case

GET    /api/cases/[id]/documents       - List documents
POST   /api/cases/[id]/documents       - Upload document
GET    /api/cases/[id]/payments        - List payments
POST   /api/cases/[id]/payments        - Add payment
GET    /api/cases/[id]/notes           - List notes
POST   /api/cases/[id]/notes           - Add note
POST   /api/cases/[id]/send-reminder   - Send email reminder
```

### Advocate Management
```
GET    /api/advocates                  - List advocates
POST   /api/advocates                  - Create advocate
GET    /api/advocates/[id]             - Get advocate details
PUT    /api/advocates/[id]             - Update advocate
DELETE /api/advocates/[id]             - Delete advocate
```

### Authentication
```
POST   /api/auth/forgot-password       - Request password reset OTP
POST   /api/auth/reset-password        - Reset password with OTP
POST   /api/auth/advocate/[...nextauth] - Advocate authentication
```

## Testing

### Test Data Creation

Create a test advocate:
```bash
curl -X POST http://localhost:3000/api/advocates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Advocate",
    "email": "test@example.com",
    "password": "Test@12345",
    "title": "Senior Advocate",
    "phone": "+91-9876543210"
  }'
```

Create a test case:
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "caseNumber": "CS/001/2024",
    "title": "Test Case Title",
    "clientName": "Test Client",
    "clientEmail": "client@example.com",
    "court": "District Court, City Name",
    "caseType": "Civil",
    "advocateId": "advocate-uuid",
    "filingDate": "2024-01-15",
    "nextHearingDate": "2024-02-01"
  }'
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cases/              # Case management endpoints
│   │   ├── advocates/          # Advocate management endpoints
│   │   └── auth/
│   │       ├── advocate/       # Advocate auth
│   │       ├── forgot-password/
│   │       └── reset-password/
│   ├── admin/
│   │   ├── (authenticated)/
│   │   │   └── cases/          # Admin case dashboard
│   │   └── login/
│   └── lawyer/
│       ├── login/              # Advocate login
│       ├── dashboard/          # Advocate dashboard
│       ├── cases/              # Cases list & detail
│       ├── profile/            # (to be created)
│       └── availability/       # (to be created)
├── components/
│   ├── admin/
│   │   ├── case-manager.tsx    # Case management UI
│   │   └── ...
│   └── ...
├── lib/
│   ├── case-pdf.ts             # PDF generation
│   ├── advocate-auth.ts        # Advocate authentication config
│   ├── auth.ts                 # Admin authentication config
│   └── ...
└── types/
    └── index.ts
```

## Features to Complete

1. **File Upload System**
   - Document upload UI component
   - File storage integration
   - Virus scanning
   - File type validation

2. **Advocate Sections** (Public)
   - Lawyer profile pages
   - Blog section
   - Practice areas listing
   - Virtual meeting scheduling
   - Success stories/testimonials
   - Availability calendar

3. **Advanced Reporting**
   - Case statistics dashboard
   - Financial reports
   - Advocate performance metrics
   - Client communication log

4. **Notifications**
   - SMS alerts for urgent hearings
   - Push notifications
   - In-app notifications
   - Email digest summaries

5. **Client Portal**
   - Clients can view their own cases
   - Document sharing
   - Payment history
   - Communication with advocate

6. **Integration Features**
   - SMS gateway integration
   - Payment gateway (Razorpay, PayU)
   - Calendar integration (Google Calendar)
   - Video conferencing (Zoom, Google Meet)

## Troubleshooting

### Password Reset Not Working
- Verify EMAIL_* variables in `.env`
- Check email provider settings
- Test with `npx prisma studio`

### Login Redirects Not Working
- Clear cookies: `localStorage.clear()`
- Check `/api/auth/advocate/[...nextauth]` exists
- Verify `advocateAuthOptions` in `/lib/advocate-auth.ts`

### Cases Not Showing for Advocate
- Verify `advocateId` is set on case
- Check advocate is marked as `isActive = true`
- Test manually: `SELECT * FROM court_cases WHERE advocateId = 'xxx'`

## Support & Notes

- All dates are in IST (Asia/Kolkata timezone)
- Currency is Indian Rupees (₹)
- Case numbers should follow format: CS/XXXX/YYYY
- Emails use Brevo (Sendinblue) API by default

For production deployment:
1. Use strong `NEXTAUTH_SECRET`
2. Enable `NEXTAUTH_SECURE_COOKIES` for HTTPS
3. Configure proper email service credentials
4. Set up database backups
5. Enable access logging and monitoring
