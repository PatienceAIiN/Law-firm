import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { generateCasePdf } from '@/lib/case-pdf'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { sendType } = body // 'DETAILS_ONLY' | 'BILL_ONLY' | 'BOTH'

    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
      include: {
        advocate: { select: { name: true, email: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        documents: true,
      },
    })

    if (!courtCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    const type = sendType || courtCase.emailControl
    if (type === 'NONE') return NextResponse.json({ message: 'Email control set to NONE - nothing sent' })

    const totalPaid = courtCase.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    const firmName = process.env.FIRM_NAME || 'Legal Excellence Law Firm'
    const advocateName = courtCase.advocate?.name || 'Lawyer'

    const includeDetails = type === 'DETAILS_ONLY' || type === 'BOTH'
    const includeBill = type === 'BILL_ONLY' || type === 'BOTH'

    const attachments: { name: string; content: string }[] = []

    if (includeDetails) {
      const detailsPdf = await generateCasePdf({
        courtCase: courtCase as any,
        firmName,
        advocateName,
        includePayments: false,
      })
      attachments.push({
        name: `case_details_${courtCase.caseNumber}.pdf`,
        content: detailsPdf,
      })
    }

    if (includeBill && courtCase.payments.length > 0) {
      const billPdf = await generateCasePdf({
        courtCase: courtCase as any,
        firmName,
        advocateName,
        includePayments: true,
      })
      attachments.push({
        name: `payment_receipt_${courtCase.caseNumber}.pdf`,
        content: billPdf,
      })
    }

    const hearingDate = courtCase.nextHearingDate
      ? new Date(courtCase.nextHearingDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        })
      : 'To be announced'

    const htmlContent = buildEmailHtml({
      clientName: courtCase.clientName,
      caseNumber: courtCase.caseNumber,
      title: courtCase.title,
      court: courtCase.court,
      status: courtCase.status,
      hearingDate,
      firmName,
      advocateName,
      totalPaid,
      includeDetails,
      includeBill,
    })

    const result = await sendEmail({
      to: courtCase.clientEmail,
      subject: `Case Update - ${courtCase.caseNumber}`,
      htmlContent,
      textContent: `Dear ${courtCase.clientName},\n\nPlease find your case update for ${courtCase.caseNumber}.\n\nNext Hearing: ${hearingDate}\nCourt: ${courtCase.court}\n\nRegards,\n${advocateName}\n${firmName}`,
      attachments,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Email failed to send' }, { status: 500 })
    }

    return NextResponse.json({ success: true, sent: type })
  } catch (error: any) {
    console.error('send-email error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}

function buildEmailHtml(d: {
  clientName: string
  caseNumber: string
  title: string
  court: string
  status: string
  hearingDate: string
  firmName: string
  advocateName: string
  totalPaid: number
  includeDetails: boolean
  includeBill: boolean
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:#14203E;padding:32px 32px 24px;text-align:center;">
      <h1 style="color:#14203E;margin:0;font-size:22px;letter-spacing:1px;">${d.firmName}</h1>
      <p style="color:#a89060;margin:6px 0 0;font-size:13px;">${d.advocateName}</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#14203E;margin:0 0 8px;">Dear <strong>${d.clientName}</strong>,</p>
      <p style="font-size:14px;color:#555;margin:0 0 24px;">Please find below your case update from our chambers.</p>

      <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:bold;width:40%;">Case Number</td><td style="padding:6px 0;font-size:13px;color:#14203E;">${d.caseNumber}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:bold;">Title</td><td style="padding:6px 0;font-size:13px;color:#14203E;">${d.title}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:bold;">Court</td><td style="padding:6px 0;font-size:13px;color:#14203E;">${d.court}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:bold;">Status</td><td style="padding:6px 0;font-size:13px;color:#14203E;">${d.status}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:bold;">Next Hearing</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#14203E;">${d.hearingDate}</td></tr>
          ${d.includeBill && d.totalPaid > 0 ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:bold;">Total Fees Paid</td><td style="padding:6px 0;font-size:13px;color:#14203E;">₹${d.totalPaid.toLocaleString('en-IN')}</td></tr>` : ''}
        </table>
      </div>

      ${d.includeDetails || d.includeBill ? `<p style="font-size:13px;color:#555;margin:0 0 24px;">The requested PDF documents are attached to this email for your records.</p>` : ''}

      <p style="font-size:13px;color:#555;">If you have any questions, please contact our office directly.</p>
      <p style="font-size:13px;color:#555;margin-top:24px;">Warm regards,<br/><strong>${d.advocateName}</strong><br/>${d.firmName}</p>
    </div>
    <div style="background:#FFFCF8;border-top:1px solid #F4E8D8;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#64748b;margin:0;">This is a confidential communication from ${d.firmName}. If received in error, please delete it.</p>
    </div>
  </div>
</body>
</html>`
}
