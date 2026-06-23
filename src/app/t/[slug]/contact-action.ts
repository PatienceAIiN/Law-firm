'use server'

import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'
import { sendEmail, generateContactEmailTemplate } from '@/lib/email'

export async function submitTenantContact(slug: string, formData: FormData) {
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { ok: false, error: 'Workspace not found' }

  const data = {
    fullName: (formData.get('fullName') as string)?.trim(),
    email: (formData.get('email') as string)?.trim(),
    subject: (formData.get('subject') as string)?.trim(),
    message: (formData.get('message') as string)?.trim(),
  }
  if (!data.fullName || !data.email || !data.subject || !data.message) {
    return { ok: false, error: 'All fields are required.' }
  }

  await prisma.contactSubmission.create({
    data: { ...data, tenantId: tenant.id, status: 'NEW' },
  })

  // Notify the tenant owner.
  await sendEmail({
    to: tenant.ownerEmail,
    subject: `New inquiry: ${data.subject}`,
    htmlContent: generateContactEmailTemplate(data),
    textContent: `New inquiry from ${data.fullName} <${data.email}>\n\n${data.message}`,
  }).catch(() => { })

  return { ok: true }
}
