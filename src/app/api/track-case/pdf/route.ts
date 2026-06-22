import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmt(d: Date | null) {
  return d ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d) : 'N/A'
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const row = await prisma.caseTrackOTP.findFirst({ where: { accessToken: token } })
  // Allow PDF for ~30 min after verification.
  if (!row || row.createdAt < new Date(Date.now() - 30 * 60 * 1000)) {
    return NextResponse.json({ error: 'Session expired. Please verify again.' }, { status: 401 })
  }

  const c = await prisma.courtCase.findUnique({
    where: { id: row.caseId },
    include: {
      advocate: { select: { name: true, title: true } },
      notes: { where: { isPrivate: false }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const navy = rgb(0.08, 0.13, 0.24)
  const gray = rgb(0.4, 0.4, 0.45)
  let y = 800

  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: navy })
  page.drawText('Case Status Report', { x: 40, y: 810, size: 18, font: bold, color: rgb(1, 1, 1) })

  y = 750
  const row2 = (label: string, value: string) => {
    page.drawText(label, { x: 40, y, size: 10, font: bold, color: gray })
    page.drawText(value || 'N/A', { x: 200, y, size: 11, font, color: navy })
    y -= 26
  }
  row2('Case Number', c.caseNumber)
  row2('Title', c.title.slice(0, 60))
  row2('Type', c.caseType)
  row2('Status', c.status)
  row2('Court', c.court)
  row2('Filing Date', fmt(c.filingDate))
  row2('Next Hearing', fmt(c.nextHearingDate))
  row2('Assigned Advocate', c.advocate ? `${c.advocate.name} (${c.advocate.title})` : 'To be assigned')

  y -= 10
  page.drawText('Case Notes', { x: 40, y, size: 13, font: bold, color: navy }); y -= 22
  if (c.notes.length === 0) {
    page.drawText('No public notes available.', { x: 40, y, size: 10, font, color: gray }); y -= 18
  } else {
    for (const n of c.notes.slice(0, 12)) {
      const line = `• ${n.content}`.slice(0, 85)
      page.drawText(line, { x: 40, y, size: 10, font, color: navy }); y -= 14
      page.drawText(fmt(n.createdAt), { x: 40, y, size: 8, font, color: gray }); y -= 16
      if (y < 80) break
    }
  }

  page.drawText(`Generated ${fmt(new Date())} · Confidential — for the named client only`, { x: 40, y: 50, size: 8, font, color: gray })

  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="case-${c.caseNumber}.pdf"` },
  })
}
