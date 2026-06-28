import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { FirmChatsPanel } from '@/components/chats/firm-chats-panel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Chats' }

export default async function AdminChatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Chats</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Live conversations from Find-Barrister visitors. Replies appear instantly on the client's screen — and yours.</p>
      <FirmChatsPanel role="admin" />
    </TenantAdminShell>
  )
}
