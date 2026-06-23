'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/super-admin'
import { invalidateTenantCache } from '@/lib/tenant'
import { invalidateCache } from '@/lib/redis'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!isSuperAdmin(session?.user?.email)) throw new Error('Unauthorized')
}

export async function setTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'deleted') {
  await requireSuperAdmin()
  if (!['active', 'suspended', 'deleted'].includes(status)) throw new Error('Invalid status')
  const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: { status } })
  await invalidateTenantCache(tenant.slug)
  await invalidateCache(`tenant_shell_v2:${tenantId}`)
  revalidatePath('/super-admin')
  revalidatePath(`/team/${tenant.slug}`, 'layout')
}

export async function deleteTenant(tenantId: string) {
  await requireSuperAdmin()
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  // Cascade is configured on Tenant relations so child rows go with it.
  await prisma.tenant.delete({ where: { id: tenantId } })
  if (tenant) {
    await invalidateTenantCache(tenant.slug)
    await invalidateCache(`tenant_shell_v2:${tenantId}`)
  }
  revalidatePath('/super-admin')
}

export async function restoreTenant(tenantId: string) {
  await requireSuperAdmin()
  const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'active' } })
  await invalidateTenantCache(tenant.slug)
  await invalidateCache(`tenant_shell_v2:${tenantId}`)
  revalidatePath('/super-admin')
  revalidatePath(`/team/${tenant.slug}`, 'layout')
}
