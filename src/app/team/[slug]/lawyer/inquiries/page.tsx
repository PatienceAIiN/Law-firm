import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { LawyerInquiriesClient } from './inquiries-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return { title: `My Inquiries — ${tenant?.name || slug}` }
}

export default async function LawyerInquiriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/lawyer/login`)

  const items = await prisma.contactSubmission.findMany({
    where: { tenantId: tenant.id, advocateId: u.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href={`/team/${slug}/lawyer`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to lawyer portal
        </Link>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">My inquiries</h1>
        <LawyerInquiriesClient
          slug={slug}
          items={items.map((i) => ({
            id: i.id,
            fullName: i.fullName,
            email: i.email,
            phone: i.phone || null,
            subject: i.subject,
            message: i.message,
            status: i.status || 'NEW',
            createdAt: i.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
