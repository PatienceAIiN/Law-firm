'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function sendDirectoryMessage(args: {
  kind: 'firm' | 'lawyer'
  targetId: string
  firmSlug?: string | null
  fullName: string
  email: string
  phone?: string
  subject?: string
  message: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const fullName = (args.fullName || '').trim()
    const email = (args.email || '').trim().toLowerCase()
    const message = (args.message || '').trim()
    if (!fullName || !email || !message) return { ok: false, error: 'Name, email, and message are required.' }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'Enter a valid email.' }

    // Resolve the tenant for the message. For lawyer inquiries the message
    // goes to the lawyer's firm (tenant) AND gets assigned to that lawyer.
    let tenantId: string | null = null
    let advocateId: string | null = null
    let firmEmail: string | null = null
    let firmName: string | null = null
    let targetName: string | null = null

    if (args.kind === 'firm') {
      const tenant = await prisma.tenant.findFirst({ where: { id: args.targetId, status: 'active' } })
      if (!tenant) return { ok: false, error: 'Firm not found.' }
      tenantId = tenant.id
      firmEmail = tenant.ownerEmail
      firmName = tenant.name
      targetName = tenant.name
    } else {
      const adv = await prisma.advocate.findFirst({
        where: { id: args.targetId, isActive: true },
        include: { tenant: true },
      })
      if (!adv || !adv.tenant) return { ok: false, error: 'Lawyer not found.' }
      tenantId = adv.tenantId
      advocateId = adv.id
      firmEmail = adv.tenant.ownerEmail
      firmName = adv.tenant.name
      targetName = `${adv.name} · ${adv.tenant.name}`
    }

    if (!tenantId) return { ok: false, error: 'Could not route the message.' }

    await prisma.contactSubmission.create({
      data: {
        fullName,
        email,
        phone: args.phone || null,
        subject: args.subject || `Find-Barrister inquiry`,
        message,
        status: advocateId ? 'ASSIGNED' : 'NEW',
        tenantId,
        advocateId: advocateId || null,
      } as any,
    })

    // Notify the firm + (when applicable) the assigned lawyer via email.
    const recipients = [firmEmail]
    if (advocateId) {
      const adv = await prisma.advocate.findUnique({ where: { id: advocateId }, select: { email: true } })
      if (adv?.email) recipients.push(adv.email)
    }
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;">
        <h2>New Find-Barrister inquiry</h2>
        <p>${fullName} reached out about <strong>${targetName}</strong>.</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          ${args.phone ? `<li><strong>Phone:</strong> ${args.phone}</li>` : ''}
        </ul>
        <blockquote style="background:#FFFCF8;border-left:3px solid #B7913D;padding:12px 14px;margin:14px 0;">${message.replace(/</g, '&lt;')}</blockquote>
      </div>`
    for (const to of recipients) {
      if (!to) continue
      sendEmail({ to, subject: args.subject || `Find-Barrister inquiry from ${fullName}`, htmlContent: html, textContent: `${fullName} <${email}>: ${message}` }).catch(() => {})
    }

    return { ok: true }
  } catch (e: any) {
    console.error('[sendDirectoryMessage]', e)
    return { ok: false, error: e?.message || 'Could not send the message.' }
  }
}
