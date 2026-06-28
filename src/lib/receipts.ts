import { getServerSession } from 'next-auth'
import nodemailer from 'nodemailer'
import { authOptions } from './auth'
import { advocateAuthOptions } from './advocate-auth'
import { prisma } from './prisma'
import { sendEmail } from './email'
import { generateReceiptPdf, type ReceiptItem } from './receipt-pdf'

// Upload a QR PNG buffer to Cloudinary (preferred) or R2 and return a
// public URL the email <img> can reference. Avoids data: URLs which Gmail
// strips for security.
async function uploadQrPng(buf: Buffer, refId: string): Promise<string | null> {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const { v2: cloudinary } = await import('cloudinary')
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })
      const dataUri = `data:image/png;base64,${buf.toString('base64')}`
      const r = await cloudinary.uploader.upload(dataUri, {
        folder: 'law_firm_qr',
        public_id: `qr-${refId}-${Date.now()}`,
        resource_type: 'image',
      })
      return r.secure_url
    }
  } catch (e) {
    console.warn('[uploadQrPng] cloudinary failed:', (e as any)?.message)
  }
  return null
}

export type PortalUser = { name: string; advocateId: string | null; isAdmin: boolean }

// Allow either an admin or an advocate (lawyer portal) session.
export async function getPortalUser(): Promise<PortalUser | null> {
  const admin = await getServerSession(authOptions)
  if (admin?.user) return { name: admin.user.name || 'Admin', advocateId: null, isAdmin: true }
  const adv = await getServerSession(advocateAuthOptions)
  if (adv?.user) return { name: adv.user.name || 'Advocate', advocateId: (adv.user as any).id || null, isAdmin: false }
  return null
}

export function computeTotals(items: ReceiptItem[], taxRate: number) {
  const normalized = items.map((it) => ({
    description: String(it.description || ''),
    qty: Number(it.qty) || 0,
    rate: Number(it.rate) || 0,
    amount: (Number(it.qty) || 0) * (Number(it.rate) || 0),
  }))
  const subtotal = normalized.reduce((s, it) => s + it.amount, 0)
  const taxAmount = +(subtotal * (Number(taxRate) || 0) / 100).toFixed(2)
  const total = +(subtotal + taxAmount).toFixed(2)
  return { items: normalized, subtotal: +subtotal.toFixed(2), taxAmount, total }
}

export async function nextReceiptNumber() {
  const count = await prisma.receipt.count()
  const year = new Date().getFullYear()
  return `RCPT-${year}-${String(count + 1).padStart(4, '0')}`
}

export function parseItems(raw: string): ReceiptItem[] {
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// Email the receipt PDF to the client (Brevo → SMTP → console-log fallback).
export async function emailReceipt(receipt: any) {
  const items = parseItems(receipt.items)
  const pdf = await generateReceiptPdf({ ...receipt, items })
  const base64 = Buffer.from(pdf).toString('base64')
  const subject = `Payment Receipt ${receipt.number}`

  // Look up the tenant so we can build the "Pay & confirm" link + render
  // the per-tenant UPI QR inline in the email body. Gmail and most clients
  // strip <img src="data:..."> for security — so we upload the PNG to
  // Cloudinary / R2 and reference the resulting public URL.
  let payUrl: string | null = null
  let qrImgUrl: string | null = null
  let upiVpa: string | null = null
  let upiName: string | null = null
  try {
    if (receipt.tenantId) {
      const { prisma: p } = await import('./prisma')
      const tenant = await p.tenant.findUnique({ where: { id: receipt.tenantId } })
      if (tenant) {
        const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
        payUrl = `${base}/team/${tenant.slug}/pay/${receipt.id}`
        const { getPaymentConfig, buildUpiUrl, buildUpiQrPng } = await import('./payments')
        const cfg = await getPaymentConfig(tenant.id)
        if ((receipt.paymentMethod || 'UPI').toString().toUpperCase() === 'UPI' && cfg.upiVpa) {
          upiVpa = cfg.upiVpa
          upiName = cfg.upiName || null
          const url = buildUpiUrl({
            vpa: cfg.upiVpa, payeeName: cfg.upiName, amount: receipt.total,
            referenceId: receipt.number, note: `Receipt ${receipt.number}`,
            currency: receipt.currency,
          })
          const pngBuf = await buildUpiQrPng(url).catch(() => null)
          if (pngBuf) {
            qrImgUrl = await uploadQrPng(pngBuf, receipt.number).catch(() => null)
          }
        }
      }
    }
  } catch (e) {
    console.warn('[emailReceipt] enrichment skipped:', (e as any)?.message)
  }

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;">
      <h2 style="color:#14203E;margin:0 0 12px;">Payment Receipt</h2>
      <p style="margin:0 0 10px;">Dear ${receipt.clientName},</p>
      <p style="margin:0 0 16px;">Your receipt <strong>${receipt.number}</strong> totalling
        <strong>${receipt.currency} ${receipt.total.toFixed(2)}</strong> is attached as a PDF.</p>
      ${qrImgUrl ? `
        <div style="text-align:center;background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:16px;margin:18px 0;">
          <img src="${qrImgUrl}" alt="UPI QR" width="220" height="220" style="display:inline-block;width:220px;height:220px;"/>
          <p style="margin:8px 0 0;font-size:13px;color:#1c2c52;"><strong>Scan to pay with any UPI app</strong></p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;">${upiVpa}${upiName ? ` · ${upiName}` : ''}</p>
        </div>` : (upiVpa ? `
        <p style="text-align:center;margin:18px 0;padding:14px;background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;">
          <strong>UPI:</strong> ${upiVpa}${upiName ? ` · ${upiName}` : ''}
        </p>` : '')}
      ${payUrl ? `
        <p style="text-align:center;margin:18px 0;">
          <a href="${payUrl}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 22px;border-radius:10px;font-weight:600;text-decoration:none;">Pay &amp; confirm payment</a>
        </p>
        <p style="font-size:12px;color:#475569;text-align:center;margin:0 0 12px;">After paying, click the button above and enter your UTR / transaction ID so we can verify it.</p>` : ''}
      <p style="color:#94a3b8;font-size:12px;margin-top:20px;">Issued by ${receipt.createdByName}.</p>
    </div>`

  const attachments = [{ name: `${receipt.number}.pdf`, content: base64 }]
  const brevo = await sendEmail({ to: receipt.clientEmail, subject, htmlContent: html, attachments })
  if (brevo.success) return 'brevo'

  if (process.env.SMTP_HOST) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
      await transport.sendMail({
        from: `${process.env.BREVO_SENDER_NAME || 'Law Firm'} <${process.env.BREVO_SENDER_EMAIL || 'noreply@lawfirm.local'}>`,
        to: receipt.clientEmail,
        subject,
        html,
        attachments: [{ filename: `${receipt.number}.pdf`, content: Buffer.from(pdf) }],
      })
      return 'smtp'
    } catch (e) {
      console.error('Receipt SMTP send failed:', e)
    }
  }

  console.log(`[Receipt] (no mail provider) would email ${receipt.number} to ${receipt.clientEmail}`)
  return 'logged'
}
