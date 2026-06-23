'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { normalizeSlug, isReservedSlug } from '@/lib/tenant'
import { setTenantSettingJson } from '@/lib/tenant-settings'

export type RequestOtpResult =
  | { ok: true; email: string; devOtp?: string }
  | { ok: false; error: string }

export type VerifyOtpResult =
  | { ok: true; slug: string; email: string; loginPath: string; sitePath: string; devPassword?: string }
  | { ok: false; error: string }

function generatePassword(): string {
  const buf = crypto.randomBytes(18)
  const base = buf.toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 12)
  return base + '@9'
}

function sixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000))
}

async function seedTenantDefaults(tenantId: string, firmName: string) {
  await setTenantSettingJson(tenantId, 'brand_config', {
    logo_text: firmName.slice(0, 3).toUpperCase(),
    firm_name: firmName,
    firm_full_name: firmName,
  })
  const defaults = [
    { title: 'Corporate Law', description: 'Business law, contracts, and corporate governance.', icon: 'building-2', order: 1 },
    { title: 'Civil Litigation', description: 'Civil disputes, property matters, and recovery suits.', icon: 'scale', order: 2 },
    { title: 'Criminal Defense', description: 'Bail, trials, appeals, and quashing matters.', icon: 'shield', order: 3 },
    { title: 'Family Law', description: 'Divorce, maintenance, custody, and matrimonial matters.', icon: 'heart', order: 4 },
  ]
  await prisma.practiceArea.createMany({
    data: defaults.map((p) => ({
      title: p.title,
      slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: p.description,
      icon: p.icon,
      order: p.order,
      isActive: true,
      tenantId,
    })),
  })
  await prisma.aboutProfile.create({
    data: {
      id: `about-${tenantId}`,
      name: firmName,
      title: 'Founder',
      aboutContent: `Welcome to ${firmName}. Update this from your admin panel.`,
      tenantId,
    },
  })
}

export async function requestSignupOtp(formData: FormData): Promise<RequestOtpResult> {
  const name = (formData.get('name') as string)?.trim()
  const firmName = (formData.get('firmName') as string)?.trim()
  const emailRaw = (formData.get('email') as string)?.trim().toLowerCase()
  const slug = normalizeSlug((formData.get('slug') as string) || firmName || '')

  if (!name || !firmName || !emailRaw || !slug) return { ok: false, error: 'Name, firm, email, and slug are required.' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw)) return { ok: false, error: 'Enter a valid email address.' }
  if (isReservedSlug(slug)) return { ok: false, error: 'That workspace name is reserved. Pick another.' }
  if (slug.length < 3) return { ok: false, error: 'Workspace slug must be at least 3 characters.' }
  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) return { ok: false, error: 'That workspace URL is already taken.' }

  const otp = sixDigitOtp()
  const payload = JSON.stringify({ name, firmName, slug, email: emailRaw })
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Clear any previous pending OTPs for this email; only one valid at a time.
  await prisma.signupOtp.deleteMany({ where: { email: emailRaw } })
  await prisma.signupOtp.create({ data: { email: emailRaw, otp, payload, expiresAt } })

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14203E;">
      <h2>Verify your email</h2>
      <p style="font-size:14px;line-height:1.6;color:#475569;">Hi ${name}, your verification code for creating <strong>${firmName}</strong> on PatienceAI is:</p>
      <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:18px;margin:18px 0;font-size:28px;font-weight:700;letter-spacing:0.4em;text-align:center;">${otp}</div>
      <p style="font-size:12px;color:#94a3b8;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
    </div>
  `
  const sent = await sendEmail({
    to: emailRaw,
    subject: `Your PatienceAI verification code: ${otp}`,
    htmlContent: html,
    textContent: `Your verification code is ${otp}. It expires in 10 minutes.`,
  })

  // Surface the OTP in dev when Brevo isn't configured so the user can still
  // proceed during local testing.
  if (!sent.success) {
    console.warn(`[signup] Brevo unavailable. OTP for ${emailRaw} = ${otp}`)
  }

  return {
    ok: true,
    email: emailRaw,
    ...(process.env.NODE_ENV !== 'production' && !sent.success ? { devOtp: otp } : {}),
  }
}

export async function verifySignupOtp(email: string, code: string): Promise<VerifyOtpResult> {
  const clean = code.toString().replace(/\D/g, '').trim()
  const emailRaw = email.toLowerCase().trim()
  if (!clean || clean.length !== 6) return { ok: false, error: 'Enter the 6-digit code.' }

  const row = await prisma.signupOtp.findFirst({
    where: { email: emailRaw, verified: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return { ok: false, error: 'No pending verification for this email. Start over.' }
  if (row.expiresAt < new Date()) return { ok: false, error: 'Code expired. Request a new one.' }
  if (row.attempts >= 5) return { ok: false, error: 'Too many attempts. Request a new code.' }

  if (row.otp !== clean) {
    await prisma.signupOtp.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
    return { ok: false, error: 'Incorrect code. Try again.' }
  }

  let payload: { name: string; firmName: string; slug: string; email: string }
  try { payload = JSON.parse(row.payload) } catch { return { ok: false, error: 'Corrupt signup data. Start over.' } }

  // Re-check slug availability — someone else might have grabbed it during
  // the OTP window.
  const slugExists = await prisma.tenant.findUnique({ where: { slug: payload.slug } })
  if (slugExists) return { ok: false, error: 'That workspace URL was just taken by someone else. Try a different slug.' }

  const password = generatePassword()
  const hashed = await bcrypt.hash(password, 10)

  const tenant = await prisma.tenant.create({
    data: {
      slug: payload.slug,
      name: payload.firmName,
      ownerEmail: payload.email,
      status: 'active',
      adminUsers: { create: [{ email: payload.email, name: payload.name, password: hashed, role: 'owner' }] },
    },
  })
  await seedTenantDefaults(tenant.id, payload.firmName)

  await prisma.signupOtp.update({ where: { id: row.id }, data: { verified: true } })

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const loginPath = `/team/${tenant.slug}/admin/login`
  const sitePath = `/team/${tenant.slug}`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14203E;">
      <h2 style="color:#14203E;margin:0 0 16px;">Your workspace is ready</h2>
      <p style="font-size:14px;line-height:1.6;color:#475569;">Hi ${payload.name}, your workspace <strong>${payload.firmName}</strong> has been activated.</p>
      <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:18px;margin:18px 0;font-size:14px;">
        <div><strong>Admin URL:</strong> <a href="${base}${loginPath}">${base}${loginPath}</a></div>
        <div style="margin-top:6px;"><strong>Email:</strong> ${payload.email}</div>
        <div style="margin-top:6px;"><strong>Password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${password}</code></div>
        <div style="margin-top:6px;"><strong>Public site:</strong> <a href="${base}${sitePath}">${base}${sitePath}</a></div>
      </div>
      <a href="${base}${loginPath}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Open admin panel</a>
    </div>
  `
  const credsSent = await sendEmail({
    to: payload.email,
    subject: `Your ${payload.firmName} admin login`,
    htmlContent: html,
    textContent: `Admin URL: ${base}${loginPath}\nEmail: ${payload.email}\nPassword: ${password}`,
  })

  if (!credsSent.success) console.warn(`[signup] Brevo unavailable. Admin creds for ${payload.email} / password: ${password}`)

  return {
    ok: true,
    slug: tenant.slug,
    email: payload.email,
    loginPath,
    sitePath,
    ...(process.env.NODE_ENV !== 'production' && !credsSent.success ? { devPassword: password } : {}),
  }
}
