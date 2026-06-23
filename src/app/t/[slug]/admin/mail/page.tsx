import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MailClient } from '@/app/admin/(authenticated)/mail/mail-client'
import { getTenantBySlug } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function TenantAdminMailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0f17] dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link href={`/t/${slug}/admin`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{tenant.name} · Mail</h1>
        <MailClient basePath={`/t/${slug}/admin/api/mail`} fullScreen />
      </div>
    </div>
  )
}
