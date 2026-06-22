import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CaseDetailClient } from './case-detail-client'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [courtCase, activities] = await Promise.all([
    prisma.courtCase.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { uploadedAt: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    }),
    prisma.caseActivity.findMany({ where: { caseId: id }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ])

  if (!courtCase) notFound()

  return (
    <>
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
        documents: courtCase.documents.map(d => ({
          ...d,
          uploadedAt: d.uploadedAt.toISOString(),
        })),
        payments: courtCase.payments.map(p => ({
          ...p,
          paymentDate: p.paymentDate.toISOString(),
          createdAt: p.createdAt.toISOString(),
        })),
      }}
    />

    {/* Audit log — who made what changes on this case */}
    <div className="mx-auto max-w-5xl px-6 pb-10">
      <div className="rounded-2xl border border-[#F4E8D8] bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-[#14203E]">Change History ({activities.length})</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-[#14203E]/50">No changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#F4E8D8] bg-[#FFFCF8] px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#14203E]">
                    {a.actorName} <span className="font-normal text-[#14203E]/50">({a.actorType.toLowerCase()})</span>
                    <span className="ml-2 rounded bg-[#F6F0E8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#14203E]">{a.action.replace(/_/g, ' ')}</span>
                  </div>
                  {a.details && <div className="text-xs text-[#14203E]/60">{a.details}</div>}
                </div>
                <span className="shrink-0 text-xs text-[#14203E]/40">{new Date(a.createdAt).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
