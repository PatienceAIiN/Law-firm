import { getServerSession } from 'next-auth'
import nodemailer from 'nodemailer'
import { authOptions } from './auth'
import { advocateAuthOptions } from './advocate-auth'
import { prisma } from './prisma'
import { sendEmail } from './email'
import { generateReceiptPdf, type ReceiptItem } from './receipt-pdf'

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
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
  let proofLink = ''
  if (base && receipt.tenantId && receipt.id) {
    const tenant = await prisma.tenant.findUnique({ where: { id: receipt.tenantId }, select: { slug: true } }).catch(() => null)
    if (tenant?.slug) proofLink = `${base}/team/${tenant.slug}/payment-done/${receipt.id}`
  }
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#14203E;">Payment Receipt</h2>
      <p>Dear ${receipt.clientName},</p>
      <p>Please find attached your receipt <strong>${receipt.number}</strong> for a total of
        <strong>${receipt.currency} ${receipt.total.toFixed(2)}</strong>.</p>
      ${proofLink ? `<p><a href="${proofLink}">Submit UTR / transaction number and payment screenshot</a></p>` : ''}
      <p style="color:#666;font-size:12px;">Issued by ${receipt.createdByName}.</p>
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
