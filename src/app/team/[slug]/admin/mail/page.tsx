import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { MailClient } from '@/components/mail/mail-client'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { prisma } from '@/lib/prisma'

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
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  
  const cases = await prisma.courtCase.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, caseNumber: true, title: true, clientName: true, clientEmail: true, nextHearingDate: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const receipts = await prisma.receipt.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, number: true, clientName: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Mail</h2>
      <MailClient 
        basePath={`/team/${slug}/admin/api/mail`} 
        fullScreen 
        cases={cases.map(c => ({ ...c, nextHearingDate: c.nextHearingDate?.toISOString() }))}
        receipts={receipts}
      />
    </TenantAdminShell>
  )
}
