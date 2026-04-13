import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CaseDetailClient } from './case-detail-client'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const courtCase = await prisma.courtCase.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { uploadedAt: 'desc' } },
      payments: { orderBy: { paymentDate: 'desc' } },
    },
  })

  if (!courtCase) notFound()

  const documents = courtCase.documents ?? []
  const payments = courtCase.payments ?? []

  return (
    <CaseDetailClient
      caseData={{
        id: courtCase.id,
        caseNumber: courtCase.caseNumber,
        title: courtCase.title,
        caseType: courtCase.caseType,
        status: courtCase.status,
        court: courtCase.court,
        judge: courtCase.judge,
        clientName: courtCase.clientName,
        clientEmail: courtCase.clientEmail,
        clientPhone: courtCase.clientPhone,
        opposingParty: courtCase.opposingParty,
        advocateId: courtCase.advocateId,
        filingDate: courtCase.filingDate?.toISOString() ?? null,
        nextHearingDate: courtCase.nextHearingDate?.toISOString() ?? null,
        courtAppearanceDate: courtCase.courtAppearanceDate?.toISOString() ?? null,
        description: courtCase.description,
        emailControl: courtCase.emailControl,
        sendReminder: courtCase.sendReminder,
        reminderSentOn: courtCase.reminderSentOn?.toISOString() ?? null,
        photoUrl: courtCase.photoUrl,
        createdAt: courtCase.createdAt.toISOString(),
        updatedAt: courtCase.updatedAt.toISOString(),
        documents: documents.map(d => ({
          ...d,
          uploadedAt: d.uploadedAt.toISOString(),
        })),
        payments: payments.map(p => ({
          ...p,
          paymentDate: p.paymentDate.toISOString(),
          createdAt: p.createdAt.toISOString(),
        })),
      }}
    />
  )
}
