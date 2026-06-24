'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'
import { WORKSPACE_LAWYER_SEAT_LIMIT } from '@/lib/workspace-limits'

export async function activateLawyer(slug: string, token: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token || !newPassword || newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { ok: false, error: 'Workspace not found.' }

  const row = await prisma.advocateActivationToken.findUnique({ where: { token } })
  if (!row) return { ok: false, error: 'Invalid activation link.' }
  if (row.used) return { ok: false, error: 'This link was already used.' }
  if (row.expiresAt < new Date()) return { ok: false, error: 'This link has expired.' }

  const advocate = await prisma.advocate.findFirst({ where: { id: row.advocateId, tenantId: tenant.id } })
  if (!advocate) return { ok: false, error: 'Account not found in this workspace.' }

  if (!advocate.isActive) {
    const activeSeats = await prisma.advocate.count({ where: { tenantId: tenant.id, isActive: true } })
    if (activeSeats >= WORKSPACE_LAWYER_SEAT_LIMIT) {
      return { ok: false, error: `This workspace already has ${WORKSPACE_LAWYER_SEAT_LIMIT} active lawyer portal seats.` }
    }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.$transaction([
    prisma.advocate.update({ where: { id: advocate.id }, data: { password: hashed, isActive: true } }),
    prisma.advocateActivationToken.update({ where: { id: row.id }, data: { used: true } }),
  ])

  return { ok: true }
}
