'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { normalizeSlug, isReservedSlug } from '@/lib/tenant'
import { setTenantSettingJson } from '@/lib/tenant-settings'

async function seedTenantDefaults(tenantId: string, firmName: string) {
  // Brand defaults
  await setTenantSettingJson(tenantId, 'brand_config', {
    logo_text: firmName.slice(0, 3).toUpperCase(),
    firm_name: firmName,
    firm_full_name: firmName,
  })

  // Starter practice areas — the same four the default tenant ships with.
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

  // Starter About Profile so the public site has owner info.
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

export type SignupResult = {
  ok: boolean
  slug?: string
  email?: string
  error?: string
  emailSent?: boolean
}

function generatePassword(): string {
  // 14-char random password with mixed case, digits, and a symbol.
  const buf = crypto.randomBytes(18)
  const base = buf
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 12)
  return base + '@9'
}

export async function signupTenant(formData: FormData): Promise<SignupResult> {
  const name = (formData.get('name') as string)?.trim()
  const firmName = (formData.get('firmName') as string)?.trim()
  const emailRaw = (formData.get('email') as string)?.trim().toLowerCase()
  let slug = normalizeSlug((formData.get('slug') as string) || firmName || '')

  if (!name || !firmName || !emailRaw || !slug) {
    return { ok: false, error: 'Name, firm, email, and slug are required.' }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  if (isReservedSlug(slug)) {
    return { ok: false, error: 'That workspace name is reserved. Pick another.' }
  }
  if (slug.length < 3) {
    return { ok: false, error: 'Workspace slug must be at least 3 characters.' }
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) return { ok: false, error: 'That workspace URL is already taken.' }

  const password = generatePassword()
  const hashed = await bcrypt.hash(password, 10)

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: firmName,
      ownerEmail: emailRaw,
      status: 'active',
      adminUsers: {
        create: [{ email: emailRaw, name, password: hashed, role: 'owner' }],
      },
    },
  })

  // Seed defaults via tenant-prefixed settings + starter rows.
  await seedTenantDefaults(tenant.id, firmName)

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const loginUrl = `${base}/t/${slug}/admin/login`
  const siteUrl = `${base}/t/${slug}`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14203E;">
      <h2 style="color:#14203E;margin:0 0 16px;">Your law-firm workspace is ready</h2>
      <p style="font-size:14px;line-height:1.6;color:#475569;">Hi ${name}, your workspace <strong>${firmName}</strong> has been created. Use the credentials below to sign in to your admin panel. We recommend changing the password right after first login.</p>
      <div style="background:#FFFCF8;border:1px solid #F4E8D8;border-radius:12px;padding:18px;margin:18px 0;font-size:14px;">
        <div><strong>Admin URL:</strong> <a href="${loginUrl}">${loginUrl}</a></div>
        <div style="margin-top:6px;"><strong>Email:</strong> ${emailRaw}</div>
        <div style="margin-top:6px;"><strong>Temporary password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${password}</code></div>
        <div style="margin-top:6px;"><strong>Your public site:</strong> <a href="${siteUrl}">${siteUrl}</a></div>
      </div>
      <a href="${loginUrl}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Open admin panel</a>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">If you didn't sign up, you can ignore this email.</p>
    </div>
  `
  const sent = await sendEmail({
    to: emailRaw,
    subject: `Your ${firmName} admin login`,
    htmlContent: html,
    textContent: `Admin URL: ${loginUrl}\nEmail: ${emailRaw}\nPassword: ${password}\nSite: ${siteUrl}`,
  })

  // In development, surface the password so the user can test even without a
  // configured Brevo key. In production, the email is the only delivery path.
  if (!sent.success) {
    console.warn('[signup] Brevo not configured; emitting credentials to server log:')
    console.warn(`[signup]   email: ${emailRaw}`)
    console.warn(`[signup]   password: ${password}`)
    console.warn(`[signup]   login: ${loginUrl}`)
  }

  return {
    ok: true,
    slug: tenant.slug,
    email: emailRaw,
    emailSent: sent.success,
    // Return the password in dev only so the welcome screen can show it when
    // Brevo isn't configured (NEXT_PUBLIC, no secrets leak).
    ...(process.env.NODE_ENV !== 'production' && !sent.success ? { error: `Dev mode — Brevo unset. Password: ${password}` } : {}),
  }
}
