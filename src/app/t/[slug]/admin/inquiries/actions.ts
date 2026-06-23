'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'

export async function assignInquiry(slug: string, inquiryId: string, advocateId: string | null) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')

  await prisma.contactSubmission.update({
    where: { id: inquiryId, tenantId: u.tenantId },
    data: { advocateId }
  })
  revalidatePath(`/t/${slug}/admin/inquiries`)
}
