import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { casesToExcelXml, casesToPdf } from '@/lib/case-import-export'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.tenantId || u.tenantSlug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const format = new URL(req.url).searchParams.get('format') === 'pdf' ? 'pdf' : 'xlsx'
  const cases = await prisma.courtCase.findMany({
    where: { tenantId: u.tenantId },
    orderBy: { updatedAt: 'desc' },
    include: { advocate: { select: { name: true } } },
  })
  const rows = cases.map((c) => ({ ...c, advocateName: c.advocate?.name || '' }))
  if (format === 'pdf') {
    const pdf = await casesToPdf(rows, `${u.tenantSlug || 'Workspace'} cases`)
    return new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="cases.pdf"' } })
  }
  return new NextResponse(casesToExcelXml(rows), { headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': 'attachment; filename="cases.xlsx"' } })
}
