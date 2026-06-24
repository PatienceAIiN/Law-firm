import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MailClient } from '@/components/mail/mail-client'
import { getTenantBySlug } from '@/lib/tenant'
import { getServerSession } from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TenantLawyerMailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const session = await getServerSession(tenantLawyerAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/lawyer/login`)

  let cases: any[] = []
  let receipts: any[] = []
  try {
    cases = await prisma.courtCase.findMany({
      where: { tenantId: tenant.id, advocateId: u.id },
      select: { id: true, caseNumber: true, title: true, clientName: true, clientEmail: true, nextHearingDate: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) { console.warn('[lawyer/mail] cases skipped:', (e as any)?.message) }
  try {
    receipts = await prisma.receipt.findMany({
      where: { tenantId: tenant.id, advocateId: u.id },
      select: { id: true, number: true, clientName: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) { console.warn('[lawyer/mail] receipts skipped:', (e as any)?.message) }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0f17] dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link href={`/team/${slug}/lawyer`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to lawyer portal
        </Link>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{tenant.name} · My Mail</h1>
        <MailClient 
          basePath={`/team/${slug}/lawyer/api/mail`} 
          fullScreen 
          cases={cases.map(c => ({ ...c, nextHearingDate: c.nextHearingDate?.toISOString() }))}
          receipts={receipts}
        />
      </div>
    </div>
  )
}
