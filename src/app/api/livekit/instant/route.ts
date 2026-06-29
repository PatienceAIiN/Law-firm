import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { getServerSession } from 'next-auth/next'
import { clientAuthOptions } from '@/lib/client-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Instant video room — a logged-in client requests a call with a lawyer.
// We mint a LiveKit room id, generate tokens for the client + lawyer, and
// email the lawyer the join link. Falls back gracefully if LiveKit isn't
// configured.
export async function POST(req: NextRequest) {
  const session = await getServerSession(clientAuthOptions)
  const u: any = session?.user
  if (!u?.email) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const tenantId = body?.tenantId
  const advocateId = body?.advocateId
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
  const advocate = advocateId ? await prisma.advocate.findFirst({ where: { id: advocateId, tenantId } }) : null

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const lkUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL
  if (!apiKey || !apiSecret || !lkUrl) {
    return NextResponse.json({ error: 'Video calls not configured on this workspace yet.' }, { status: 412 })
  }

  const roomId = `room-${crypto.randomBytes(6).toString('hex')}`
  const clientTok = new AccessToken(apiKey, apiSecret, { identity: u.email, name: u.name || u.email })
  clientTok.addGrant({ roomJoin: true, room: roomId })
  const clientJwt = await clientTok.toJwt()

  const lawyerTok = new AccessToken(apiKey, apiSecret, { identity: advocate?.email || tenant.ownerEmail, name: advocate?.name || tenant.name })
  lawyerTok.addGrant({ roomJoin: true, room: roomId })
  const lawyerJwt = await lawyerTok.toJwt()

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const lawyerJoin = `${base}/meeting/instant/${roomId}?token=${encodeURIComponent(String(lawyerJwt))}&url=${encodeURIComponent(lkUrl)}&name=${encodeURIComponent(advocate?.name || tenant.name)}`
  const clientJoin = `${base}/meeting/instant/${roomId}?token=${encodeURIComponent(String(clientJwt))}&url=${encodeURIComponent(lkUrl)}&name=${encodeURIComponent(u.name || u.email)}`

  const to = advocate?.email || tenant.ownerEmail
  sendEmail({
    to,
    subject: `${u.name || u.email} is requesting a video call`,
    htmlContent: `<p>${u.name || u.email} (${u.email}) requested an instant video consultation.</p><p><a href="${lawyerJoin}" style="display:inline-block;background:#14203E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Join the call</a></p>`,
    textContent: `Join video: ${lawyerJoin}`,
  }).catch(() => {})

  return NextResponse.json({ roomId, joinUrl: clientJoin, livekitUrl: lkUrl })
}
