# Law Firm Case Management System - Production Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 12+
- GitHub account
- Vercel account
- Brevo (Sendinblue) account for emails
- Git configured

## Step 1: Clone Repository

```bash
git clone https://github.com/thegeekygamechanger/law-firm.git
cd law-firm
npm install
```

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env.local` and update with production values:

```bash
cp .env.example .env.local
```

**Critical Production Settings:**

```env
# Use a production database
DATABASE_URL="postgresql://user:securepassword@prod-db.example.com:5432/law_firm"

# Generate secure NEXTAUTH_SECRET
openssl rand -base64 32
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-generated-secret"

# Brevo for email notifications
BREVO_API_KEY="your-production-brevo-key"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"

# Firm details
FIRM_NAME="Your Law Firm Name"
FIRM_EMAIL="contact@yourdomain.com"
```

## Step 3: Database Setup

### Local PostgreSQL

```bash
# Create database
createdb law_firm

# Run migrations
npx prisma db push

# Optional: Seed with admin user
npx prisma db seed
```

### Remote Database (e.g., AWS RDS, Neon)

1. Create PostgreSQL database
2. Update `DATABASE_URL` in environment
3. Run: `npx prisma db push`

## Step 4: Create Initial Admin User

```bash
node scripts/create-admin.js --email admin@yourlawfirm.com --password "SecurePassword123!"
```

Or manually via database:

```sql
-- Generate password hash with bcrypt (use Node.js console)
const hash = await bcrypt.hash('YourPassword123!', 10);

INSERT INTO admin_users (id, email, name, password, role, created_at, updated_at)
VALUES (
  'cuid_value',
  'admin@yourlawfirm.com',
  'Admin Name',
  'hash_value',
  'admin',
  NOW(),
  NOW()
);
```

## Step 5: Build & Test Locally

```bash
npm run build
npm start
```

Access: `http://localhost:3000`

**Test Admin Portal:**
- URL: `http://localhost:3000/admin/login`
- Email: `admin@yourlawfirm.com`
- Password: (your configured password)

**Test Advocate Portal:**
- URL: `http://localhost:3000/lawyer/login`
- Create advocate account via admin dashboard

## Step 6: Push to GitHub

```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial law firm case management system"

# Add GitHub remote
git remote add origin https://github.com/thegeekygamechanger/law-firm.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 7: Deploy to Vercel

### Option A: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. Configure project settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install`

### Option B: Deploy via CLI

```bash
npm install -g vercel
vercel --prod
```

### Environment Variables on Vercel

Add these in Vercel project settings:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://[your-vercel-domain].vercel.app
NEXTAUTH_SECRET=[generate-new-secret]
BREVO_API_KEY=...
FIRM_NAME=Your Law Firm
```

## Step 8: Database Migrations

After deployment to Vercel:

```bash
# Using Vercel CLI
vercel env pull

# Run migrations
npx prisma db push

# View admin dashboard
# https://[your-vercel-domain].vercel.app/admin/login
```

## Step 9: Custom Domain (Optional)

1. Go to Vercel project settings
2. Add custom domain
3. Update DNS records
4. Update `NEXTAUTH_URL` to custom domain

## Testing Production Deployment

### API Tests

```bash
# List Cases
curl -H "Authorization: Bearer [token]" \
  https://yourdomain.com/api/cases

# Create Case
curl -X POST https://yourdomain.com/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "caseNumber": "TEST-2024-001",
    "title": "Test Case",
    "caseType": "Civil",
    "court": "High Court",
    "clientName": "Test Client",
    "clientEmail": "test@example.com"
  }'
```

### UI Tests

1. Admin login - http://yourdomain.com/admin
2. Create test case
3. Add payment
4. Upload document
5. Test email notifications
6. Advocate login - http://yourdomain.com/lawyer

## Production Checklist

- [ ] Database backups configured
- [ ] Email provider (Brevo) tested
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Error logging enabled
- [ ] Database connection pooling
- [ ] CDN configured (if needed)
- [ ] Regular database backups
- [ ] Monitoring alerts set up

## Monitoring & Maintenance

### Logs

```bash
# Vercel logs
vercel logs [deployment-url]

# Database logs (check provider)
# PostgreSQL: check server logs
```

### Backups

Automatic daily backups recommended. Set up through:
- Database provider (AWS RDS, Neon, etc.)
- Vercel deployment snapshots
- GitHub repository backups

### Updates

```bash
# Get latest updates
git pull origin main

# Update dependencies
npm update

# Rebuild and deploy
npm run build
vercel deploy --prod
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check Prisma connection
npx prisma db execute --stdin
```

### Email Not Sending

1. Check Brevo API key in Vercel env
2. Test email service: `npm run test:email`
3. Check spam folder
4. Verify sender email in Brevo

### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Ensure Node.js version matches
3. Clear build cache: Vercel → Settings → Git → Clear Cache
4. Check for missing environment variables

## Support

For issues:
1. Check application logs
2. Review database state
3. Check email provider status
4. Review API endpoint implementations

## Security Notes

- Never commit `.env` files
- Rotate `NEXTAUTH_SECRET` periodically
- Use strong database passwords
- Enable SSL/TLS for database connections
- Implement rate limiting
- Regular security audits
- Keep dependencies updated
