'use server'

import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

type Recipient = { name: string; email: string }
type Item = { label: string; url: string; body: string }

export async function sharePackages(
  slug: string,
  payload: { recipients: Recipient[]; items: Item[] },
): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) return { ok: false, error: 'Unauthorized' }
  if (!Array.isArray(payload.recipients) || payload.recipients.length === 0) return { ok: false, error: 'No recipients selected.' }
  if (!Array.isArray(payload.items) || payload.items.length === 0) return { ok: false, error: 'No pages selected.' }

  const tenant = await prisma.tenant.findUnique({ where: { id: u.tenantId } })
  const senderName = session!.user!.name || u.email

  const list = payload.items
    .map((i) => `<li style="margin:8px 0;"><a href="${i.url}" style="font-weight:600;color:#14203E;">${i.label}</a><br><span style="color:#64748b;font-size:12px;">${i.body}</span></li>`)
    .join('')

  await Promise.allSettled(
    payload.recipients
      .filter((r) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))
      .map((r) =>
        sendEmail({
          to: r.email,
          subject: `Quick links from ${tenant?.name || 'the workspace'}`,
          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14203E;">
              <h2>Workspace quick links</h2>
              <p style="font-size:14px;color:#475569;">Hi ${r.name}, ${senderName} shared these pages with you:</p>
              <ul style="font-size:14px;list-style:none;padding:0;">${list}</ul>
              <p style="font-size:12px;color:#94a3b8;">From ${tenant?.name || 'the firm'} on Patience AI.</p>
            </div>
          `,
          textContent:
            `Quick links from ${tenant?.name || 'the workspace'}:\n` +
            payload.items.map((i) => `• ${i.label} — ${i.url}`).join('\n'),
        }),
      ),
  )

  return { ok: true, sent: payload.recipients.length }
}
