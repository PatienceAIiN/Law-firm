import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Check if admin user exists with this email
    const admin = await prisma.adminUser.findUnique({ where: { email } })
    if (!admin) {
      // Don't reveal whether email exists — return success anyway
      return NextResponse.json({ success: true })
    }

    // Invalidate old OTPs for this email
    await prisma.passwordResetOTP.updateMany({
      where: { email, used: false },
      data: { used: true },
    })

    // Create new OTP valid for 15 minutes
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.passwordResetOTP.create({
      data: { email, otp, expiresAt },
    })

    const firmName = process.env.FIRM_NAME || 'Legal Excellence'

    await sendEmail({
      to: email,
      subject: `Admin Password Reset OTP — ${firmName}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FFFCF8;border-radius:16px;">
          <h2 style="color:#14203E;margin:0 0 8px;">Password Reset</h2>
          <p style="color:#475569;margin:0 0 24px;">Use the OTP below to reset your admin password. It expires in <strong>15 minutes</strong>.</p>
          <div style="background:#14203E;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#14203E;">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:12px;">If you did not request this, ignore this email. Your password will remain unchanged.</p>
        </div>`,
      textContent: `Your OTP is: ${otp}\n\nThis expires in 15 minutes. If you did not request this, ignore this email.`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('forgot-password error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
