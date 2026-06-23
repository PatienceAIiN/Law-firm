import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { getTenantSettingValue } from '@/lib/tenant-settings'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { LegalEditor } from './legal-editor'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return { title: `Legal — ${tenant?.name || slug}` }
}

export default async function TenantLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)

  const [terms, privacy] = await Promise.all([
    getTenantSettingValue(tenant.id, 'terms_html'),
    getTenantSettingValue(tenant.id, 'privacy_html'),
  ])
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-2 text-xl font-bold text-primary dark:text-white">Legal pages</h2>
      <p className="mb-4 text-sm text-slate-500">Edit your Terms and Privacy text. Changes go live on <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/team/{slug}/terms</code> and <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/team/{slug}/privacy</code> the moment you hit Save.</p>
      <LegalEditor slug={slug} initialTerms={terms || ''} initialPrivacy={privacy || ''} />
    </TenantAdminShell>
  )
}
