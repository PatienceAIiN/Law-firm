'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string }
}

export async function createTestimonial(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const name = (formData.get('name') as string)?.trim()
  const role = (formData.get('role') as string)?.trim() || null
  const content = (formData.get('content') as string)?.trim()
  const rating = parseInt((formData.get('rating') as string) || '5', 10)
  if (!name || !content) throw new Error('Name and content are required')
  await prisma.testimonial.create({ data: { name, role: role || undefined, content, rating, isActive: true, tenantId } })
  revalidatePath(`/team/${slug}/admin/testimonials`); revalidatePath(`/team/${slug}`)
}

export async function deleteTestimonial(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.testimonial.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/team/${slug}/admin/testimonials`); revalidatePath(`/team/${slug}`)
}
