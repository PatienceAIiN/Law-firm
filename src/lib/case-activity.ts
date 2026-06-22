import { prisma } from './prisma'

export async function logCaseActivity(opts: {
  caseId: string
  actorType: 'ADVOCATE' | 'ADMIN'
  actorName: string
  action: string
  details?: string
}) {
  try {
    await prisma.caseActivity.create({
      data: {
        caseId: opts.caseId,
        actorType: opts.actorType,
        actorName: opts.actorName,
        action: opts.action,
        details: opts.details || null,
      },
    })
  } catch {
    // Never block the main action on an audit-log failure.
  }
}
