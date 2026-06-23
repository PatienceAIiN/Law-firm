import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function sixDigitOtp() { return String(crypto.randomInt(100000, 1000000)) }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const emailRaw = (body.email || '').toString().trim().toLowerCase()
  if (!emailRaw || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw)) {
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })
  }

  // Always respond the same way whether or not the email matches a workspace —
  // don't leak which emails own tenants. Email is only sent if there's a hit.
  const adminUsers = await prisma.adminUser.findMany({
    where: { email: emailRaw, tenant: { status: 'active' } },
    select: { id: true, tenant: { select: { slug: true, name: true } } },
  })

  let devOtp: string | undefined
  if (adminUsers.length > 0) {
    const otp = sixDigitOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.workspaceOpenOtp.deleteMany({ where: { email: emailRaw } })
    await prisma.workspaceOpenOtp.create({ data: { email: emailRaw, otp, expiresAt } })

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14203E;">
        <h2>Sign in to your workspace</h2>
        <p style="font-size:14px;line-height:1.6;color:#475569;">Use this 6-digit code to open your PatienceAI workspace:</p>
        <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:18px;margin:18px 0;font-size:28px;font-weight:700;letter-spacing:0.4em;text-align:center;">${otp}</div>
        <p style="font-size:12px;color:#94a3b8;">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>
    `
    const sent = await sendEmail({
      to: emailRaw,
      subject: `Your PatienceAI sign-in code: ${otp}`,
      htmlContent: html,
      textContent: `Your sign-in code is ${otp}. Expires in 10 minutes.`,
    })
    if (!sent.success) {
      console.warn(`[workspace-open] Brevo unavailable. OTP for ${emailRaw} = ${otp}`)
      if (process.env.NODE_ENV !== 'production') devOtp = otp
    }
  }

  return NextResponse.json({ ok: true, ...(devOtp ? { devOtp } : {}) })
}
