'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'

async function requireTenant(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string, slug }
}

export async function createPracticeArea(slug: string, formData: FormData) {
  const { tenantId } = await requireTenant(slug)
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || ''
  if (!title) throw new Error('Title is required')
  const slugified = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  await prisma.practiceArea.create({
    data: { title, slug: slugified, description, tenantId, isActive: true, order: 0 },
  })
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}

export async function deletePracticeArea(slug: string, id: string) {
  const { tenantId } = await requireTenant(slug)
  await prisma.practiceArea.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}

export async function createAdvocate(slug: string, formData: FormData) {
  const { tenantId } = await requireTenant(slug)
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const title = (formData.get('title') as string)?.trim() || 'Advocate'
  if (!name || !email || password.length < 8) throw new Error('Name, email and password (≥8 chars) are required')
  const hashed = await bcrypt.hash(password, 10)
  await prisma.advocate.create({
    data: { name, email, password: hashed, title, isActive: true, tenantId },
  })
  revalidatePath(`/t/${slug}/admin`)
}

export async function deleteAdvocate(slug: string, id: string) {
  const { tenantId } = await requireTenant(slug)
  await prisma.advocate.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/t/${slug}/admin`)
}

export async function createBlogPost(slug: string, formData: FormData) {
  const { tenantId } = await requireTenant(slug)
  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string) || ''
  if (!title) throw new Error('Title is required')
  const slugified = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  await prisma.blogPost.create({
    data: { title, slug: slugified, content, status: 'PUBLISHED', publishedAt: new Date(), tenantId },
  })
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}

export async function deleteBlogPost(slug: string, id: string) {
  const { tenantId } = await requireTenant(slug)
  await prisma.blogPost.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}
