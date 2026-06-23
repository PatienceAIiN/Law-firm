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

export async function createCase(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const data = {
    caseNumber: (formData.get('caseNumber') as string)?.trim(),
    title: (formData.get('title') as string)?.trim(),
    caseType: (formData.get('caseType') as string)?.trim() || 'Civil',
    status: (formData.get('status') as string)?.trim() || 'ACTIVE',
    court: (formData.get('court') as string)?.trim(),
    clientName: (formData.get('clientName') as string)?.trim(),
    clientEmail: (formData.get('clientEmail') as string)?.trim() || '',
    clientPhone: (formData.get('clientPhone') as string)?.trim() || '',
    advocateId: (formData.get('advocateId') as string) || null,
    nextHearingDate: (formData.get('nextHearingDate') as string) || null,
  }
  if (!data.caseNumber || !data.title || !data.court || !data.clientName) {
    throw new Error('Case number, title, court, and client name are required')
  }

  // Ensure advocate (if specified) belongs to this tenant.
  if (data.advocateId) {
    const adv = await prisma.advocate.findFirst({ where: { id: data.advocateId, tenantId } })
    if (!adv) throw new Error('Selected lawyer not in this workspace')
  }

  await prisma.courtCase.create({
    data: {
      caseNumber: data.caseNumber,
      title: data.title,
      caseType: data.caseType,
      status: data.status,
      court: data.court,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone || undefined,
      advocateId: data.advocateId || undefined,
      nextHearingDate: data.nextHearingDate ? new Date(data.nextHearingDate) : undefined,
      tenantId,
    },
  })
  revalidatePath(`/t/${slug}/admin/cases`)
  revalidatePath(`/t/${slug}/lawyer`)
}

export async function deleteCase(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.courtCase.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/t/${slug}/admin/cases`)
}
