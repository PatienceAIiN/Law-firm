import { prisma } from './prisma'
import { fetchWithCache, invalidateCache } from './redis'

// Per-tenant settings live in the global SiteSetting table under prefixed keys
// so the legacy unique-key constraint stays intact. New tenants never collide
// with default-tenant keys because the prefix is the tenantId.
export function tenantKey(tenantId: string, key: string): string {
  return `t_${tenantId}__${key}`
}

export async function getTenantSettingValue(tenantId: string, key: string): Promise<string | null> {
  return fetchWithCache(
    `tenant_setting:${tenantId}:${key}`,
    async () => {
      const prefixed = await prisma.siteSetting.findUnique({ where: { key: tenantKey(tenantId, key) } })
      if (prefixed) return prefixed.value
      const legacy = await prisma.siteSetting.findFirst({ where: { tenantId, key } })
      return legacy?.value || null
    },
    86400
  )
}

export async function setTenantSettingValue(tenantId: string, key: string, value: string): Promise<void> {
  const k = tenantKey(tenantId, key)
  await prisma.siteSetting.upsert({
    where: { key: k },
    update: { value },
    create: { key: k, value, tenantId },
  })
  await invalidateCache(`tenant_setting:${tenantId}:${key}`)
}

export async function deleteTenantSetting(tenantId: string, key: string): Promise<void> {
  await prisma.siteSetting.deleteMany({ where: { key: tenantKey(tenantId, key) } })
  await invalidateCache(`tenant_setting:${tenantId}:${key}`)
}

export async function getTenantSettingJson<T = any>(tenantId: string, key: string): Promise<T | null> {
  const raw = await getTenantSettingValue(tenantId, key)
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

export async function setTenantSettingJson(tenantId: string, key: string, value: any): Promise<void> {
  await setTenantSettingValue(tenantId, key, JSON.stringify(value))
}

// Gmail account storage keys per scope inside a tenant.
export function tenantGmailAdminKey(tenantId: string): string {
  return tenantKey(tenantId, 'gmail_account_admin')
}
export function tenantGmailLawyerKey(tenantId: string, advocateId: string): string {
  return tenantKey(tenantId, `gmail_account_lawyer_${advocateId}`)
}
