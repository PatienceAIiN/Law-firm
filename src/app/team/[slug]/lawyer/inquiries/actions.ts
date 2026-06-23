'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

async function authed(slug: string) {
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return {
    tenantId: u.tenantId as string,
    advocateId: u.id as string,
    advocateName: session!.user!.name || u.email,
  }
}

export async function replyLawyerInquiry(
  slug: string,
  inquiryId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { tenantId, advocateId, advocateName } = await authed(slug)
    const text = (body || '').toString().trim()
    if (!text) return { ok: false, error: 'Reply body is empty.' }

    const inquiry = await prisma.contactSubmission.findFirst({
      where: { id: inquiryId, tenantId, advocateId },
    })
    if (!inquiry) return { ok: false, error: 'Inquiry not found or not assigned to you.' }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14203E;">
        <p style="font-size:14px;color:#475569;">Hi ${inquiry.fullName},</p>
        <div style="font-size:14px;line-height:1.7;color:#1e293b;white-space:pre-wrap;">${text}</div>
        <hr style="border:none;border-top:1px solid #F4E8D8;margin:20px 0;">
        <p style="font-size:12px;color:#94a3b8;">— ${advocateName}, ${tenant?.name || 'the team'}</p>
      </div>
    `
    await sendEmail({
      to: inquiry.email,
      subject: `Re: ${inquiry.subject || 'Your inquiry'}`,
      htmlContent: html,
      textContent: text,
    })
    await prisma.contactSubmission.update({ where: { id: inquiry.id }, data: { status: 'REPLIED' } })
    revalidatePath(`/team/${slug}/lawyer/inquiries`)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to send' }
  }
}

export async function archiveLawyerInquiry(slug: string, inquiryId: string) {
  const { tenantId, advocateId } = await authed(slug)
  await prisma.contactSubmission.updateMany({
    where: { id: inquiryId, tenantId, advocateId },
    data: { status: 'ARCHIVED' },
  })
  revalidatePath(`/team/${slug}/lawyer/inquiries`)
}
