'use server'

import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug, invalidateTenantCache } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { invalidateCache } from '@/lib/redis'

export async function requestDeleteOtp(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')

  const tenant = await getTenantBySlug(slug)
  if (!tenant) throw new Error('Tenant not found')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.workspaceOpenOtp.deleteMany({ where: { email: 'delete:' + u.email } })
  await prisma.workspaceOpenOtp.create({
    data: {
      email: 'delete:' + u.email,
      otp,
      expiresAt,
    }
  })

  await sendEmail({
    to: u.email,
    subject: `Workspace Deletion Verification OTP`,
    htmlContent: `
      <h2>Delete Workspace Verification</h2>
      <p>You requested to delete your workspace <strong>${tenant.name}</strong>.</p>
      <p>Your one-time password is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    `
  })

  return { success: true }
}

export async function verifyDeleteOtpAndSoftDelete(slug: string, otp: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')

  const tenant = await getTenantBySlug(slug)
  if (!tenant) throw new Error('Tenant not found')

  const record = await prisma.workspaceOpenOtp.findFirst({
    where: { email: 'delete:' + u.email }
  })

  if (!record) throw new Error('OTP not requested or expired')
  if (record.otp !== otp) {
    await prisma.workspaceOpenOtp.update({ where: { id: record.id }, data: { attempts: record.attempts + 1 } })
    throw new Error('Invalid OTP')
  }
  if (record.expiresAt < new Date()) throw new Error('OTP has expired')

  await prisma.workspaceOpenOtp.delete({ where: { id: record.id } })

  // Soft delete the tenant
  await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'deleted' } })

  // Bust Redis caches so the site blocks access immediately
  await invalidateTenantCache(slug)
  await invalidateCache(`tenant_shell_v2:${tenant.id}`)
  
  return { success: true }
}
