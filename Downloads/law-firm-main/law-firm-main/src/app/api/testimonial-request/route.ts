import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateTestimonialRequestEmail } from '@/lib/email'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Admin: POST to send a testimonial request to a client
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { recipientEmail, recipientName } = await req.json()
  if (!recipientEmail || !recipientName) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
  }

  const request = await (prisma as any).testimonialRequest.create({
    data: { recipientEmail, recipientName },
  })

  const profile = await (prisma as any).aboutProfile.findFirst()
  const firmName = profile?.name || 'Our Law Firm'
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const formUrl = `${baseUrl}/testimonial-request/${request.token}`

  await sendEmail({
    to: recipientEmail,
    subject: `Share your experience with ${firmName}`,
    htmlContent: generateTestimonialRequestEmail({ recipientName, formUrl, firmName }),
    textContent: `Dear ${recipientName}, please share your experience: ${formUrl}`,
  })

  return NextResponse.json({ success: true, id: request.id })
}

// Public: GET to fetch a pending request by token (for the form page)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const request = await (prisma as any).testimonialRequest.findUnique({ where: { token } })
  if (!request) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  if (request.status !== 'PENDING') return NextResponse.json({ error: 'This form has already been submitted' }, { status: 409 })

  return NextResponse.json({ recipientName: request.recipientName })
}

// Public: PATCH to submit the testimonial form
export async function PATCH(req: NextRequest) {
  const { token, name, role, content, rating } = await req.json()
  if (!token || !name || !content) {
    return NextResponse.json({ error: 'Token, name, and content are required' }, { status: 400 })
  }

  const request = await (prisma as any).testimonialRequest.findUnique({ where: { token } })
  if (!request) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  if (request.status !== 'PENDING') return NextResponse.json({ error: 'This form has already been submitted' }, { status: 409 })

  await (prisma as any).testimonialRequest.update({
    where: { token },
    data: {
      status: 'SUBMITTED',
      submittedName: name,
      submittedRole: role || null,
      submittedContent: content,
      submittedRating: rating ? parseInt(rating, 10) : 5,
    },
  })

  return NextResponse.json({ success: true })
}
