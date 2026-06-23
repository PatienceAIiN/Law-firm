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

function bust(slug: string) {
  revalidatePath(`/team/${slug}/admin/team`)
  revalidatePath(`/team/${slug}`)
  revalidatePath(`/team/${slug}/team`)
}

export async function createTeamMember(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const name = (formData.get('name') as string)?.trim()
  const title = (formData.get('title') as string)?.trim() || 'Team Member'
  const bio = (formData.get('bio') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || null
  const image = (formData.get('image') as string)?.trim() || null
  if (!name) throw new Error('Name is required')
  await prisma.teamMember.create({
    data: { name, title, bio, email: email || undefined, image: image || undefined, isActive: true, tenantId },
  })
  bust(slug)
}

export async function updateTeamMember(slug: string, id: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const name = (formData.get('name') as string)?.trim()
  const title = (formData.get('title') as string)?.trim() || 'Team Member'
  const bio = (formData.get('bio') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || null
  const image = (formData.get('image') as string)?.trim() || null
  if (!name) throw new Error('Name is required')
  await prisma.teamMember.updateMany({
    where: { id, tenantId },
    data: { name, title, bio, email: email || null, image: image || null },
  })
  bust(slug)
}

export async function deleteTeamMember(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.teamMember.deleteMany({ where: { id, tenantId } })
  bust(slug)
}
