import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { ArrowLeft } from 'lucide-react'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { getTenantSettingJson } from '@/lib/tenant-settings'
import { BrandLogoForm } from '@/components/admin/brand-logo-form'
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link href={`/t/${slug}/admin`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Branding</h1>
        <p className="mb-6 text-sm text-slate-500">Upload a logo or set styled text. Changes show on your public site at <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/t/{slug}</code>.</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
          <BrandLogoForm brand={brand} updateBrand={onUpdate} />
        </div>
      </div>
    </div>
  )
}
