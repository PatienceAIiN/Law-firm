import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { MailClient } from '@/components/mail/mail-client'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantAdminShell } from '@/components/tenant/admin-shell'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return { title: `Mail — ${tenant?.name || slug}` }
}

export default async function TenantAdminMailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/t/${slug}/admin/login`)
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-[#14203E] dark:text-white">Mail</h2>
      <MailClient basePath={`/t/${slug}/admin/api/mail`} fullScreen />
    </TenantAdminShell>
  )
}
