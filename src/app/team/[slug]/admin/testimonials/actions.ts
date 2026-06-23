'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string }
}

export async function askTestimonial(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const clientName = (formData.get('clientName') as string)?.trim()
  const clientEmail = (formData.get('clientEmail') as string)?.trim()
  if (!clientName || !clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
    throw new Error('Client name and a valid email are required')
  }

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  await prisma.testimonialAskToken.create({
    data: { token, tenantId, clientName, clientEmail, expiresAt },
  })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${base}/team/${slug}/testimonial/${token}`

  await sendEmail({
    to: clientEmail,
    subject: `Share your experience with ${tenant?.name || 'us'}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;">
        <h2>How was your experience?</h2>
        <p style="font-size:14px;line-height:1.6;color:#475569;">
          Hi ${clientName}, ${tenant?.name || 'we'} would love a few words about your experience.
          Click below to leave a rating + short note — takes under a minute.
        </p>
        <p style="margin:20px 0;">
          <a href="${url}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
            Share your testimonial
          </a>
        </p>
        <p style="font-size:12px;color:#94a3b8;">Link expires in 14 days. If you didn't expect it, ignore this email.</p>
      </div>
    `,
    textContent: `Share your testimonial: ${url}`,
  }).catch(() => {})

  if (process.env.NODE_ENV !== 'production') console.warn(`[testimonial] Ask link for ${clientEmail}: ${url}`)
  revalidatePath(`/team/${slug}/admin/testimonials`)
}

export async function approveTestimonial(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.testimonial.updateMany({
    where: { id, tenantId },
    data: { status: 'PUBLISHED', isActive: true },
  })
  revalidatePath(`/team/${slug}/admin/testimonials`)
  revalidatePath(`/team/${slug}`)
  revalidatePath(`/team/${slug}/team`)
}

export async function rejectTestimonial(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.testimonial.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/team/${slug}/admin/testimonials`)
}

export async function deleteTestimonial(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.testimonial.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/team/${slug}/admin/testimonials`)
  revalidatePath(`/team/${slug}`)
}
