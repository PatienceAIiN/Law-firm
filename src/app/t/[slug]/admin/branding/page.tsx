import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { getTenantSettingJson } from '@/lib/tenant-settings'
import { DEFAULT_THEME } from '@/lib/theme'
import { BrandingClient } from './branding-client'

export const dynamic = 'force-dynamic'

export default async function TenantBrandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  const tenantTheme = await getTenantSettingJson(tenant.id, 'site_theme') || {}
  const theme = { ...DEFAULT_THEME, ...tenantTheme }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-primary dark:text-white">Workspace Branding</h2>
        <p className="text-sm text-slate-500">Configure colors, fonts, and logos for your portal.</p>
      </div>
      <BrandingClient slug={slug} theme={theme} />
    </TenantAdminShell>
  )
}
