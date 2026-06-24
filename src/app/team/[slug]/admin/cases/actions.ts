'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { parseCaseCsv } from '@/lib/case-import-export'

async function authed(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string }
}

export async function createCase(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const data = {
    caseNumber: (formData.get('caseNumber') as string)?.trim(),
    title: (formData.get('title') as string)?.trim(),
    caseType: (formData.get('caseType') as string)?.trim() || 'Civil',
    status: (formData.get('status') as string)?.trim() || 'ACTIVE',
    court: (formData.get('court') as string)?.trim(),
    clientName: (formData.get('clientName') as string)?.trim(),
    clientEmail: (formData.get('clientEmail') as string)?.trim() || '',
    clientPhone: (formData.get('clientPhone') as string)?.trim() || '',
    advocateId: (formData.get('advocateId') as string) || null,
    nextHearingDate: (formData.get('nextHearingDate') as string) || null,
  }
  if (!data.caseNumber || !data.title || !data.court || !data.clientName) {
    throw new Error('Case number, title, court, and client name are required')
  }

  // Ensure advocate (if specified) belongs to this tenant.
  if (data.advocateId) {
    const adv = await prisma.advocate.findFirst({ where: { id: data.advocateId, tenantId } })
    if (!adv) throw new Error('Selected lawyer not in this workspace')
  }

  await prisma.courtCase.create({
    data: {
      caseNumber: data.caseNumber,
      title: data.title,
      caseType: data.caseType,
      status: data.status,
      court: data.court,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone || undefined,
      advocateId: data.advocateId || undefined,
      nextHearingDate: data.nextHearingDate ? new Date(data.nextHearingDate) : undefined,
      tenantId,
    },
  })
  revalidatePath(`/team/${slug}/admin/cases`)
  revalidatePath(`/team/${slug}/lawyer`)
}

export async function deleteCase(slug: string, id: string) {
  const { tenantId } = await authed(slug)
  await prisma.courtCase.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/team/${slug}/admin/cases`)
}


export async function importCases(slug: string, formData: FormData) {
  const { tenantId } = await authed(slug)
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('Choose a CSV or XLSX file')
  const name = file.name.toLowerCase()
  if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) throw new Error('Only CSV and XLSX files are accepted')
  const text = await file.text()
  const rows = parseCaseCsv(text)
  if (rows.length === 0) throw new Error('No valid cases found. Use columns: Case Number, Title, Type, Status, Court, Client Name, Client Email, Client Phone, Next Hearing.')
  let created = 0
  for (const row of rows) {
    const existing = await prisma.courtCase.findFirst({ where: { tenantId, caseNumber: row.caseNumber } })
    if (existing) continue
    await prisma.courtCase.create({
      data: {
        tenantId,
        caseNumber: row.caseNumber,
        title: row.title,
        caseType: row.caseType || 'Civil',
        status: row.status || 'ACTIVE',
        court: row.court,
        clientName: row.clientName,
        clientEmail: row.clientEmail || '',
        clientPhone: row.clientPhone || undefined,
        nextHearingDate: row.nextHearingDate ? new Date(row.nextHearingDate) : undefined,
      },
    })
    created++
  }
  revalidatePath(`/team/${slug}/admin/cases`)
  return { created, skipped: rows.length - created }
}
