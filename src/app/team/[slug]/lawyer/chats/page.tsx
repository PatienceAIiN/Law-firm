import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { FirmChatsPanel } from '@/components/chats/firm-chats-panel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Chats' }

export default async function LawyerChatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/lawyer/login`)
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-primary dark:text-white">Chats</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Your conversations from Find-Barrister visitors. Only chats assigned to you are visible.</p>
      <FirmChatsPanel role="lawyer" />
    </div>
  )
}
