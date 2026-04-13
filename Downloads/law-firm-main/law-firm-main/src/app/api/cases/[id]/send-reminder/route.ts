import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST /api/cases/[id]/send-reminder - Send court appearance reminder
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
        payments: true,
      },
    })

    if (!courtCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (!courtCase.nextHearingDate) {
      return NextResponse.json(
        { error: 'No hearing date set for this case' },
        { status: 400 }
      )
    }

    // Calculate total fees paid
    const totalPaid = courtCase.payments.reduce((sum, p) => sum + p.amount, 0)

    // Generate email content
    const hearingDate = new Date(courtCase.nextHearingDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    let emailContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#faf8f5;border-radius:16px;">
        <h2 style="color:#1a1208;">Court Appearance Reminder</h2>
        <p>Dear ${courtCase.clientName},</p>
        <p>This is a reminder about your upcoming court appearance for the following case:</p>
        
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #d4a853;">
          <p><strong>Case Number:</strong> ${courtCase.caseNumber}</p>
          <p><strong>Title:</strong> ${courtCase.title}</p>
          <p><strong>Court:</strong> ${courtCase.court}</p>
          <p><strong>Hearing Date:</strong> <span style="color:#d4a853;font-weight:bold;">${hearingDate}</span></p>
          ${courtCase.judge ? `<p><strong>Judge:</strong> ${courtCase.judge}</p>` : ''}
          ${courtCase.advocate?.name ? `<p><strong>Your Advocate:</strong> ${courtCase.advocate.name}</p>` : ''}
        </div>

        ${courtCase.emailControl === 'BILL_ONLY' || courtCase.emailControl === 'BOTH' ? `
          <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-top:2px solid #d4a853;">
            <h3 style="color:#1a1208;margin-top:0;">Fee Details</h3>
            <p><strong>Total Fees Collected:</strong> ₹${totalPaid.toFixed(2)}</p>
          </div>
        ` : ''}

        <p style="color:#8c7355;font-size:12px;">Please ensure you are present at the court on the scheduled date. If you have any questions, please contact ${courtCase.advocate?.email || 'your advocate'}.</p>
      </div>
    `

    // Send email
    await sendEmail({
      to: courtCase.clientEmail,
      subject: `Court Appearance Reminder - ${courtCase.caseNumber}`,
      htmlContent: emailContent,
      textContent: `Court Appearance Reminder for case ${courtCase.caseNumber} on ${hearingDate}`,
    })

    // Update reminder sent timestamp
    await prisma.courtCase.update({
      where: { id },
      data: {
        reminderSentOn: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
    })
  } catch (error: any) {
    console.error('Send reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
