import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { generateCasePdf } from '@/lib/case-pdf'

// POST /api/cases/[id]/send-reminder - Send court appearance reminder to file owner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
      include: {
        advocate: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        documents: true,
      },
    })

    if (!courtCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (!courtCase.nextHearingDate && !courtCase.courtAppearanceDate) {
      return NextResponse.json(
        { error: 'No hearing or appearance date set for this case' },
        { status: 400 }
      )
    }

    const recipientEmail = courtCase.advocate?.email || courtCase.clientEmail
    const recipientName = courtCase.advocate?.name || courtCase.clientName
    const firmName = process.env.FIRM_NAME || 'Legal Excellence Law Firm'
    const advocateName = courtCase.advocate?.name || 'Senior Advocate'
    const payments = courtCase.payments ?? []
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const hearingDate = courtCase.courtAppearanceDate || courtCase.nextHearingDate
    const hearingLabel = hearingDate
      ? new Date(hearingDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be announced'

    const attachments = [
      {
        name: `case_details_${courtCase.caseNumber}.pdf`,
        content: await generateCasePdf({
          courtCase: courtCase as any,
          firmName,
          advocateName,
          includePayments: false,
        }),
      },
    ]

    if (payments.length > 0) {
      attachments.push({
        name: `payment_receipt_${courtCase.caseNumber}.pdf`,
        content: await generateCasePdf({
          courtCase: courtCase as any,
          firmName,
          advocateName,
          includePayments: true,
        }),
      })
    }

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#faf8f5;border-radius:16px;">
        <h2 style="color:#1a1208;">Court Appearance Reminder</h2>
        <p>Dear ${recipientName},</p>
        <p>This is a reminder for the upcoming appearance assigned to this file.</p>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #d4a853;">
          <p><strong>Case Number:</strong> ${courtCase.caseNumber}</p>
          <p><strong>Title:</strong> ${courtCase.title}</p>
          <p><strong>Court:</strong> ${courtCase.court}</p>
          <p><strong>Appearance Date:</strong> <span style="color:#d4a853;font-weight:bold;">${hearingLabel}</span></p>
          ${courtCase.judge ? `<p><strong>Judge:</strong> ${courtCase.judge}</p>` : ''}
          ${courtCase.advocate?.name ? `<p><strong>File Owner:</strong> ${courtCase.advocate.name}</p>` : ''}
        </div>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-top:2px solid #d4a853;">
          <h3 style="color:#1a1208;margin-top:0;">Fees Snapshot</h3>
          <p><strong>Total Fees Recorded:</strong> ₹${totalPaid.toFixed(2)}</p>
          <p style="margin-bottom:0;color:#8c7355;font-size:12px;">Case detail and receipt PDFs are attached when payment records exist.</p>
        </div>

        <p style="color:#8c7355;font-size:12px;">Please ensure attendance and case preparation are completed before the scheduled date.</p>
        <p style="color:#8c7355;font-size:12px;">${courtCase.advocate?.email ? `Reply to ${courtCase.advocate.email}` : `Contact ${firmName}`}</p>
      </div>
    `

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Court Appearance Reminder - ${courtCase.caseNumber}`,
      htmlContent,
      textContent: `Court Appearance Reminder for case ${courtCase.caseNumber} on ${hearingLabel}`,
      attachments,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 })
    }

    await prisma.courtCase.update({
      where: { id },
      data: {
        reminderSentOn: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      sentTo: recipientEmail,
    })
  } catch (error: any) {
    console.error('Send reminder error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
