import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const email = (body?.email || '').toString().trim().toLowerCase()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  const otp = String(crypto.randomInt(100000, 1000000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.clientLoginOtp.deleteMany({ where: { email } })
  await prisma.clientLoginOtp.create({ data: { email, otp, expiresAt } })

  const sent = await sendEmail({
    to: email,
    subject: `Your Find-Barrister verification code: ${otp}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14203E;">
        <h2>Verify your email</h2>
        <p style="font-size:14px;color:#475569;">Your one-time code for signing in to Find Barrister:</p>
        <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:18px;margin:18px 0;font-size:28px;font-weight:700;letter-spacing:0.4em;text-align:center;">${otp}</div>
        <p style="font-size:12px;color:#94a3b8;">Expires in 10 minutes. If you didn't request this, ignore it.</p>
      </div>`,
    textContent: `Your verification code is ${otp} (expires in 10 minutes).`,
  })
  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV !== 'production' && !sent.success ? { devOtp: otp } : {}),
  })
}
