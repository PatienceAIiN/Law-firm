import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'email, otp, and newPassword are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find valid OTP
    const record = await prisma.passwordResetOTP.findFirst({
      where: {
        email,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12)

    // Update admin password
    await prisma.adminUser.update({
      where: { email },
      data: { password: hashed },
    })

    // Mark OTP as used
    await prisma.passwordResetOTP.update({
      where: { id: record.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('reset-password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
