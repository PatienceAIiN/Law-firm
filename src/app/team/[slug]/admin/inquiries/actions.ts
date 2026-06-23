'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string, adminName: session!.user!.name || u.email }
}

export async function assignInquiry(slug: string, inquiryId: string, advocateId: string | null) {
  const { tenantId } = await authed(slug)

  if (advocateId) {
    const adv = await prisma.advocate.findFirst({ where: { id: advocateId, tenantId } })
    if (!adv) throw new Error('Lawyer not in this workspace')
  }

  const inquiry = await prisma.contactSubmission.findFirst({
    where: { id: inquiryId, tenantId },
  })
  if (!inquiry) throw new Error('Inquiry not found')

  await prisma.contactSubmission.update({
    where: { id: inquiryId },
    data: { advocateId, status: advocateId ? 'ASSIGNED' : 'NEW' },
  })

  // Notify the assigned lawyer.
  if (advocateId) {
    const adv = await prisma.advocate.findUnique({ where: { id: advocateId }, select: { name: true, email: true } })
    if (adv?.email) {
      const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
      const portalUrl = `${base}/team/${slug}/lawyer/inquiries`
      await sendEmail({
        to: adv.email,
        subject: `Inquiry assigned: ${inquiry.subject}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;">
            <h2>You've been assigned an inquiry</h2>
            <p style="font-size:14px;line-height:1.6;color:#475569;">Hi ${adv.name},</p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">A new inquiry has been routed to you. Open your inquiries tab to reply.</p>
            <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:16px;margin:16px 0;font-size:14px;">
              <div><strong>From:</strong> ${inquiry.fullName} &lt;${inquiry.email}&gt;</div>
              ${inquiry.phone ? `<div><strong>Phone:</strong> ${inquiry.phone}</div>` : ''}
              <div style="margin-top:6px;"><strong>Subject:</strong> ${inquiry.subject}</div>
              <div style="margin-top:6px;white-space:pre-wrap;">${inquiry.message}</div>
            </div>
            <p style="margin:16px 0;"><a href="${portalUrl}" style="display:inline-block;background:#14203E;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Open in lawyer portal</a></p>
          </div>
        `,
        textContent: `Inquiry from ${inquiry.fullName} <${inquiry.email}>:\n${inquiry.message}\n\nOpen: ${portalUrl}`,
      }).catch(() => {})
    }
  }

  revalidatePath(`/team/${slug}/admin/inquiries`)
}

export async function replyInquiry(slug: string, inquiryId: string, body: string) {
  const { tenantId, adminName } = await authed(slug)
  const text = (body || '').toString().trim()
  if (!text) throw new Error('Reply body cannot be empty')

  const inquiry = await prisma.contactSubmission.findFirst({
    where: { id: inquiryId, tenantId },
  })
  if (!inquiry) throw new Error('Inquiry not found')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, ownerEmail: true } })
  const subject = `Re: ${inquiry.subject || 'Your inquiry'}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14203E;">
      <p style="font-size:14px;color:#475569;">Hi ${inquiry.fullName},</p>
      <div style="font-size:14px;line-height:1.7;color:#1e293b;white-space:pre-wrap;">${text}</div>
      <hr style="border:none;border-top:1px solid #F4E8D8;margin:20px 0;">
      <p style="font-size:12px;color:#94a3b8;">— ${adminName}, ${tenant?.name || 'the team'}</p>
    </div>
  `
  await sendEmail({
    to: inquiry.email,
    subject,
    htmlContent: html,
    textContent: text,
  })

  await prisma.contactSubmission.update({
    where: { id: inquiry.id },
    data: { status: 'REPLIED' },
  })
  revalidatePath(`/team/${slug}/admin/inquiries`)
}

export async function setInquiryStatus(slug: string, inquiryId: string, status: string) {
  const { tenantId } = await authed(slug)
  const allowed = ['NEW', 'ASSIGNED', 'REPLIED', 'ARCHIVED']
  if (!allowed.includes(status)) throw new Error('Invalid status')
  await prisma.contactSubmission.updateMany({ where: { id: inquiryId, tenantId }, data: { status } })
  revalidatePath(`/team/${slug}/admin/inquiries`)
}

export async function deleteInquiry(
  slug: string,
  inquiryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { tenantId } = await authed(slug)
    await prisma.contactSubmission.deleteMany({ where: { id: inquiryId, tenantId } })
    revalidatePath(`/team/${slug}/admin/inquiries`)
    return { ok: true }
  } catch (e: any) {
    console.error('[deleteInquiry]', e)
    return { ok: false, error: e?.message || 'Could not delete the inquiry.' }
  }
}
