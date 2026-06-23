'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { invalidateCache } from '@/lib/redis'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { sendEmail } from '@/lib/email'

async function requireTenant(slug: string) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')
  return { tenantId: u.tenantId as string, slug }
}

export async function createPracticeArea(slug: string, formData: FormData) {
  const { tenantId } = await requireTenant(slug)
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || ''
  if (!title) throw new Error('Title is required')
  const slugified = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  await prisma.practiceArea.create({
    data: { title, slug: slugified, description, tenantId, isActive: true, order: 0 },
  })
  await invalidateCache(`tenant_shell:${tenantId}`)
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}

export async function deletePracticeArea(slug: string, id: string) {
  const { tenantId } = await requireTenant(slug)
  await prisma.practiceArea.deleteMany({ where: { id, tenantId } })
  await invalidateCache(`tenant_shell:${tenantId}`)
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}

export async function createAdvocate(slug: string, formData: FormData) {
  const { tenantId } = await requireTenant(slug)
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const title = (formData.get('title') as string)?.trim() || 'Advocate'
  if (!name || !email) throw new Error('Name and email are required')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Valid email required')

  // Lawyer is created INACTIVE with a random placeholder password; they set
  // their own password via an activation link sent to their email.
  const placeholder = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10)
  const advocate = await prisma.advocate.create({
    data: { name, email, password: placeholder, title, isActive: false, tenantId },
  })

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  await prisma.advocateActivationToken.create({
    data: { advocateId: advocate.id, token, expiresAt },
  })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
  const activateUrl = `${base}/t/${slug}/lawyer/activate?token=${token}`

  await sendEmail({
    to: email,
    subject: `Activate your account at ${tenant?.name || slug}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;">
        <h2>You're invited to the lawyer portal</h2>
        <p style="font-size:14px;line-height:1.6;color:#475569;">
          Hi ${name}, ${tenant?.name || 'the firm'} has invited you to the lawyer portal.
          Click below to set your password and activate your account.
        </p>
        <p style="margin:20px 0;">
          <a href="${activateUrl}" style="display:inline-block;background:#14203E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
            Activate &amp; set password
          </a>
        </p>
        <p style="font-size:12px;color:#94a3b8;">This link expires in 48 hours. If you didn't expect it, ignore this email.</p>
      </div>
    `,
    textContent: `Activate your lawyer account: ${activateUrl}\nLink expires in 48 hours.`,
  }).catch(() => {})

  if (process.env.NODE_ENV !== 'production') console.warn(`[lawyer] Activation link for ${email}: ${activateUrl}`)
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}/admin/lawyers`)
  return { ok: true, activationUrl: process.env.NODE_ENV !== 'production' ? activateUrl : undefined }
}

export async function deleteAdvocate(slug: string, id: string) {
  const { tenantId } = await requireTenant(slug)
  await prisma.advocate.deleteMany({ where: { id, tenantId } })
  revalidatePath(`/t/${slug}/admin`)
}

export async function createBlogPost(slug: string, formData: FormData) {
  const { tenantId } = await requireTenant(slug)
  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string) || ''
  const excerpt = (formData.get('excerpt') as string)?.trim() || null
  const coverImage = (formData.get('coverImage') as string)?.trim() || null
  if (!title) throw new Error('Title is required')
  const slugified = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  await prisma.blogPost.create({
    data: {
      title, slug: slugified, content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      status: 'PUBLISHED', publishedAt: new Date(), tenantId,
    },
  })
  await invalidateCache(`tenant_shell:${tenantId}`)
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}

export async function deleteBlogPost(slug: string, id: string) {
  const { tenantId } = await requireTenant(slug)
  await prisma.blogPost.deleteMany({ where: { id, tenantId } })
  await invalidateCache(`tenant_shell:${tenantId}`)
  revalidatePath(`/t/${slug}/admin`)
  revalidatePath(`/t/${slug}`)
}
