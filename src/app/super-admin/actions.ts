'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/super-admin'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!isSuperAdmin(session?.user?.email)) throw new Error('Unauthorized')
}

export async function setTenantStatus(tenantId: string, status: 'active' | 'suspended') {
  await requireSuperAdmin()
  if (!['active', 'suspended'].includes(status)) throw new Error('Invalid status')
  await prisma.tenant.update({ where: { id: tenantId }, data: { status } })
  revalidatePath('/super-admin')
}

export async function deleteTenant(tenantId: string) {
  await requireSuperAdmin()
  // Cascade is configured on Tenant relations so child rows go with it.
  await prisma.tenant.delete({ where: { id: tenantId } })
  revalidatePath('/super-admin')
}
