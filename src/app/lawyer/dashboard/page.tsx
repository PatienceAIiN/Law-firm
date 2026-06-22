import { getServerSession } from 'next-auth/next'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LawyerDashboard } from './lawyer-dashboard'

export const metadata = {
  title: 'Advocate Dashboard | Law Firm',
  manifest: '/manifest-lawyer.webmanifest',
  appleWebApp: { capable: true, title: 'Advocate Portal' },
}
export const dynamic = 'force-dynamic'

export default async function LawyerDashboardPage() {
  const session = await getServerSession(advocateAuthOptions)
  if (!session || !session.user.id) redirect('/lawyer/login')

  const advocate = await prisma.advocate.findUnique({
    where: { id: session.user.id },
    include: {
      cases: {
        include: { documents: { select: { id: true } }, payments: { select: { amount: true } } },
        orderBy: { nextHearingDate: 'asc' },
      },
      accessLogs: { orderBy: { loginTime: 'desc' }, take: 25 },
    },
  })
  if (!advocate) redirect('/lawyer/login')

  const stats = {
    activeCases: advocate.cases.filter((c) => c.status === 'ACTIVE').length,
    upcomingHearings: advocate.cases.filter((c) => c.nextHearingDate && new Date(c.nextHearingDate) > new Date()).length,
    totalDocuments: advocate.cases.reduce((s, c) => s + c.documents.length, 0),
    totalFeePaid: advocate.cases.reduce((s, c) => s + c.payments.reduce((a, p) => a + p.amount, 0), 0),
  }

  return (
    <LawyerDashboard
      advocate={{
        id: advocate.id, name: advocate.name, title: advocate.title, email: advocate.email,
        bio: advocate.bio, phone: advocate.phone, expertise: advocate.expertise,
        education: advocate.education, barCouncilId: advocate.barCouncilId,
      }}
      stats={stats}
      cases={advocate.cases.map((c) => ({
        id: c.id, caseNumber: c.caseNumber, title: c.title, clientName: c.clientName,
        status: c.status, court: c.court, nextHearingDate: c.nextHearingDate ? c.nextHearingDate.toISOString() : null,
      }))}
      accessLogs={advocate.accessLogs.map((l) => ({
        id: l.id, loginTime: l.loginTime.toISOString(), ipAddress: l.ipAddress, userAgent: l.userAgent,
      }))}
    />
  )
}
