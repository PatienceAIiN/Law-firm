'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'

export async function submitTestimonial(
  slug: string,
  token: string,
  input: { content: string; rating: number; role: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { ok: false, error: 'Workspace not found.' }

  const row = await prisma.testimonialAskToken.findUnique({ where: { token } })
  if (!row || row.tenantId !== tenant.id) return { ok: false, error: 'Invalid link.' }
  if (row.used) return { ok: false, error: 'This link has already been used.' }
  if (row.expiresAt < new Date()) return { ok: false, error: 'Link expired.' }

  const rating = Math.max(1, Math.min(5, Math.floor(input.rating || 5)))
  const content = (input.content || '').toString().trim()
  if (content.length < 10) return { ok: false, error: 'Write at least 10 characters.' }

  // Pending testimonial — admin must approve before it appears on the public site.
  await prisma.$transaction([
    prisma.testimonial.create({
      data: {
        tenantId: tenant.id,
        name: row.clientName,
        role: input.role?.trim() || null,
        content,
        rating,
        status: 'PENDING',
        isActive: false,
      },
    }),
    prisma.testimonialAskToken.update({ where: { id: row.id }, data: { used: true } }),
  ])

  revalidatePath(`/team/${slug}/admin/testimonials`)
  return { ok: true }
}
