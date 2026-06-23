import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { getTenantSettingJson } from '@/lib/tenant-settings'
import { BrandLogoForm } from '@/components/admin/brand-logo-form'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { updateTenantBrand } from './actions'

export const dynamic = 'force-dynamic'

export default async function TenantBrandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)

  const brand = (await getTenantSettingJson<any>(tenant.id, 'brand_config')) || { firm_name: tenant.name, logo_text: tenant.name.slice(0, 3).toUpperCase() }

  const onUpdate = async (formData: FormData) => {
    'use server'
    await updateTenantBrand(slug, formData)
  }

  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-2 text-xl font-bold text-[#14203E] dark:text-white">Branding</h2>
      <p className="mb-4 text-sm text-slate-500">Upload a logo or set styled text. Changes show on your public site at <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/t/{slug}</code>.</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <BrandLogoForm brand={brand} updateBrand={onUpdate} />
      </div>
    </TenantAdminShell>
  )
}
