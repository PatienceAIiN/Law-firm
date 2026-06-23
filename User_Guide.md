# Welcome to Barrister By Patience AI
**Your Law Firm, Fully Online.**

Welcome to your new digital workspace. This guide will walk you through the essential features of your tenant environment, empowering you to manage your firm, clients, and consultations securely and efficiently.

---

## 1. Getting Started
When your workspace is created, you will be given an **Admin Login**. Use this to access your Firm Dashboard. 
- **Your Public Site:** `https://yourdomain.com/t/your-firm`
- **Admin Dashboard:** `https://yourdomain.com/t/your-firm/admin/login`

### Initial Setup
1. **Branding:** Go to the **Settings > Branding** tab. Update your Firm Name, upload a Logo, and select your primary and accent colors.
2. **Office Details:** Add your contact email, phone number, and physical office address. This information will appear in your site's footer and contact page.

---

## 2. Managing Your Firm
### Practice Areas
Your public site displays the legal services you offer. 
- Navigate to **Practice Areas** in the admin panel to add or remove services.
- Describe each area clearly—this helps clients understand your expertise and boosts your search visibility.

### Team & Lawyers
Each lawyer in your firm gets their own dedicated portal. 
1. In the Admin Dashboard, click on **Lawyers**.
2. Click **Add Lawyer** and provide their Name, Title, and Email.
3. The system will automatically send an activation email to the lawyer. They will use the link to set their secure password.

---

## 3. The Lawyer Portal
Each lawyer logs in at `https://yourdomain.com/t/your-firm/lawyer/login`.
Inside the Lawyer Portal, advocates can:
- **Manage Cases:** Track active cases, hearings, and upload related documents.
- **Set Availability:** Define when they are available for client consultations. 
- **Generate Receipts:** Create payment receipts for clients.

### Setting Availability (Virtual & In-Person)
1. Go to the **Availability** tab.
2. Select a Date, Start Time, and End Time.
3. **Choose the Mode:** You can choose to accept *Virtual Only*, *In-Person Only*, or *Both*.
4. Clients visiting the public site will instantly see these available time slots.

---

## 4. Client Consultations & Virtual Meetings
Barrister streamlines how clients book and meet with you.
1. Clients visit your public site and click **Book Consultation**.
2. They select an available lawyer, a time slot, and their preferred meeting mode.
3. If they choose **Online video call**, the system automatically generates a secure, unique meeting room link.
4. An automated email is dispatched to both the client and the lawyer containing the meeting link and details.

### Hosting a Virtual Meeting
- At the scheduled time, click the meeting link in your email or your dashboard.
- You will enter a secure, encrypted LiveKit meeting room right in your browser—no downloads required.

---

## 5. Security & Data Isolation
Your workspace is completely sandboxed.
- **Tenant Isolation:** Your cases, client details, and communications are strictly separated from other law firms.
- **Caching:** The platform leverages Redis caching to ensure your public pages load instantly for clients without compromising real-time updates.

---
*For technical support or feature requests, please contact the Patience AI team.*
