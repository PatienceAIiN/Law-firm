const BREVO_EMAIL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

const sender = {
  email: process.env.BREVO_SENDER_EMAIL || 'noreply@yourdomain.com',
  name: process.env.BREVO_SENDER_NAME || 'Law Firm',
}

export interface EmailData {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
}

export type ClientEmailTemplateType = 'booking_confirmation' | 'consultation_reminder' | 'follow_up'

export async function sendEmail(data: EmailData) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return { success: false, error: new Error('BREVO_API_KEY is not configured') }
  }

  try {
    const response = await fetch(BREVO_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: data.to }],
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
      }),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(message || `Brevo request failed with status ${response.status}`)
    }

    return { success: true, data: await response.json().catch(() => ({})) }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

export function generateContactEmailTemplate(data: {
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
  serviceType?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .field { margin: 15px 0; }
        .label { font-weight: bold; color: #1e293b; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">Name:</span> ${data.fullName}
          </div>
          <div class="field">
            <span class="label">Email:</span> ${data.email}
          </div>
          ${data.phone ? `<div class="field"><span class="label">Phone:</span> ${data.phone}</div>` : ''}
          <div class="field">
            <span class="label">Subject:</span> ${data.subject}
          </div>
          ${data.serviceType ? `<div class="field"><span class="label">Service Type:</span> ${data.serviceType}</div>` : ''}
          <div class="field">
            <span class="label">Message:</span>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent from the law firm website contact form.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateBookingConfirmationEmail(data: {
  name: string
  email: string
  date: string
  time: string
  meetingMode: string
  meetingLink?: string
  physicalAddress?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Consultation Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .field { margin: 15px 0; }
        .label { font-weight: bold; color: #1e293b; }
        .cta-button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Consultation Booking Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${data.name},</p>
          <p>Your consultation has been successfully booked. Here are the details:</p>
          
          <div class="field">
            <span class="label">Date:</span> ${data.date}
          </div>
          <div class="field">
            <span class="label">Time:</span> ${data.time}
          </div>
          <div class="field">
            <span class="label">Meeting Mode:</span> ${data.meetingMode}
          </div>
          
          ${data.meetingLink ? `
            <div class="field">
              <span class="label">Meeting Link:</span> 
              <a href="${data.meetingLink}" class="cta-button">Join Meeting</a>
            </div>
          ` : ''}
          
          ${data.physicalAddress ? `
            <div class="field">
              <span class="label">Address:</span> ${data.physicalAddress}
            </div>
          ` : ''}
          
          <p>Please ensure you are available at the scheduled time. If you need to reschedule, please contact us as soon as possible.</p>
        </div>
        <div class="footer">
          <p>This email was sent from the law firm consultation booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateBookingNotificationEmail(data: {
  name: string
  email: string
  phone: string
  date: string
  time: string
  meetingMode: string
  meetingLink?: string
  physicalAddress?: string
  notes?: string
  subject?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Consultation Booking</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .field { margin: 15px 0; }
        .label { font-weight: bold; color: #1e293b; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Consultation Scheduled</h1>
        </div>
        <div class="content">
          <div class="field"><span class="label">Name:</span> ${data.name}</div>
          <div class="field"><span class="label">Email:</span> ${data.email}</div>
          <div class="field"><span class="label">Phone:</span> ${data.phone}</div>
          <div class="field"><span class="label">Date:</span> ${data.date}</div>
          <div class="field"><span class="label">Time:</span> ${data.time}</div>
          <div class="field"><span class="label">Mode:</span> ${data.meetingMode}</div>
          ${data.subject ? `<div class="field"><span class="label">Subject:</span> ${data.subject}</div>` : ''}
          ${data.meetingLink ? `<div class="field"><span class="label">Meeting Link:</span> <a href="${data.meetingLink}">${data.meetingLink}</a></div>` : ''}
          ${data.physicalAddress ? `<div class="field"><span class="label">Location:</span> ${data.physicalAddress}</div>` : ''}
          ${data.notes ? `<div class="field"><span class="label">Notes:</span><p>${data.notes.replace(/\n/g, '<br>')}</p></div>` : ''}
        </div>
        <div class="footer">
          <p>This email was sent from the law firm consultation booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateSlotFullAdminEmail(data: {
  date: string
  startTime: string
  endTime: string
  capacity: number
  bookings: Array<{
    name: string
    email: string
    phone: string
    meetingMode: string
    meetingLink?: string | null
    subject?: string
  }>
}) {
  const rows = data.bookings.map((b, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'}">
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${b.name}</td>
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${b.email}</td>
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${b.phone}</td>
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${b.meetingMode.replace(/_/g, ' ')}</td>
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${b.meetingLink ? `<a href="${b.meetingLink}" style="color:#1e40af;">${b.meetingLink}</a>` : '—'}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Slot Fully Booked</title>
    </head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;">
      <div style="max-width:700px;margin:0 auto;padding:20px;">
        <div style="background:#1e293b;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">Slot Fully Booked — Summary</h1>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">
            All seats for the following slot are now fully booked. Here is the complete list of confirmed participants:
          </p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <div style="font-weight:bold;color:#1e293b;">📅 ${data.date} &nbsp;|&nbsp; 🕐 ${data.startTime} — ${data.endTime} &nbsp;|&nbsp; 🎟️ ${data.capacity} seats</div>
          </div>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            <thead>
              <tr style="background:#1e293b;color:#fff;">
                <th style="padding:12px;text-align:left;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;">Name</th>
                <th style="padding:12px;text-align:left;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;">Email</th>
                <th style="padding:12px;text-align:left;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;">Phone</th>
                <th style="padding:12px;text-align:left;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;">Mode</th>
                <th style="padding:12px;text-align:left;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;">Meeting Link</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="text-align:center;color:#64748b;font-size:12px;margin-top:16px;padding:12px;">
          <p>This notification was sent automatically from the law firm consultation booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateTestimonialRequestEmail(data: {
  recipientName: string
  formUrl: string
  firmName: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Share Your Experience</title>
    </head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#1e293b;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:22px;">Share Your Experience</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">${data.firmName}</p>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Dear ${data.recipientName},</p>
          <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.7;">
            Thank you for choosing us for your legal needs. We value your feedback tremendously and would love to hear about your experience working with our team.
          </p>
          <p style="font-size:14px;color:#475569;margin:0 0 28px;line-height:1.7;">
            If you're willing to share a few words about your experience, it would mean a great deal to us and help future clients understand the quality of service they can expect.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${data.formUrl}" style="background:#c5a059;color:#1e293b;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
              Share My Testimonial
            </a>
          </div>
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
            This link is personal and unique to you. If you did not request this or wish to opt out, simply ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateClientEmailPayload(data: {
  templateType: ClientEmailTemplateType
  name: string
  email: string
  date: string
  time: string
  meetingMode: string
  meetingLink?: string
  physicalAddress?: string
  subject?: string
}) {
  const meetingModeLabel = data.meetingMode.replace(/_/g, ' ')

  if (data.templateType === 'consultation_reminder') {
    return {
      subject: `Reminder: your consultation on ${data.date} at ${data.time}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consultation Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Consultation Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${data.name},</p>
              <p>This is a reminder for your consultation scheduled on ${data.date} at ${data.time}.</p>
              <div class="field"><span class="label">Meeting Mode:</span> ${meetingModeLabel}</div>
              ${data.meetingLink ? `<div class="field"><span class="label">Meeting Link:</span> <a href="${data.meetingLink}">${data.meetingLink}</a></div>` : ''}
              ${data.physicalAddress ? `<div class="field"><span class="label">Location:</span> ${data.physicalAddress}</div>` : ''}
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `Reminder: your consultation is scheduled on ${data.date} at ${data.time}.`,
    }
  }

  if (data.templateType === 'follow_up') {
    return {
      subject: `Follow-up after your consultation on ${data.date}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consultation Follow-up</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Follow-up After Consultation</h1>
            </div>
            <div class="content">
              <p>Dear ${data.name},</p>
              <p>Thank you for meeting with us. We are sharing the follow-up summary for your ${meetingModeLabel} consultation.</p>
              <div class="field"><span class="label">Consultation Date:</span> ${data.date}</div>
              <div class="field"><span class="label">Consultation Time:</span> ${data.time}</div>
              ${data.subject ? `<div class="field"><span class="label">Matter:</span> ${data.subject}</div>` : ''}
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `Follow-up after consultation on ${data.date} at ${data.time}.`,
    }
  }

  return {
    subject: `Consultation confirmed for ${data.date} ${data.time}`,
    htmlContent: generateBookingConfirmationEmail({
      name: data.name,
      email: data.email,
      date: data.date,
      time: data.time,
      meetingMode: data.meetingMode,
      meetingLink: data.meetingLink,
      physicalAddress: data.physicalAddress,
    }),
    textContent: `Your consultation has been confirmed for ${data.date} at ${data.time}.`,
  }
}
