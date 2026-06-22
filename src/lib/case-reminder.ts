import { prisma } from './prisma'
import { sendEmail } from './email'

function fmt(d: Date | null) {
  return d ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(d) : 'N/A'
}

// Builds and sends a case reminder email to the client (and advocate) with the
// latest case details, next hearing, document links and an optional message.
export async function sendCaseReminder(caseId: string, opts: { message?: string | null; includeDetails?: boolean } = {}) {
  const c = await prisma.courtCase.findUnique({
    where: { id: caseId },
    include: {
      advocate: { select: { name: true, email: true } },
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  })
  if (!c) return { success: false, error: 'Case not found' }

  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const docLinks = c.documents
    .map((d) => `<li><a href="${d.fileUrl.startsWith('http') ? d.fileUrl : `${base}/uploads/cases/${d.fileUrl}`}">${escapeHtml(d.name)}</a></li>`)
    .join('')

  const details = opts.includeDetails !== false
    ? `<div style="background:#fff;border:1px solid #e8e3dc;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Case No:</strong> ${escapeHtml(c.caseNumber)}</p>
        <p style="margin:4px 0;"><strong>Title:</strong> ${escapeHtml(c.title)}</p>
        <p style="margin:4px 0;"><strong>Status:</strong> ${c.status}</p>
        <p style="margin:4px 0;"><strong>Court:</strong> ${escapeHtml(c.court)}</p>
        <p style="margin:4px 0;"><strong>Next Hearing:</strong> ${fmt(c.nextHearingDate)}</p>
        <p style="margin:4px 0;"><strong>Advocate:</strong> ${escapeHtml(c.advocate?.name || 'Assigned advocate')}</p>
        ${docLinks ? `<p style="margin:12px 0 4px;"><strong>Documents:</strong></p><ul>${docLinks}</ul>` : ''}
      </div>`
    : ''

  const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="color:#14203E;">Case Update & Reminder</h2>
    <p>Dear ${escapeHtml(c.clientName)},</p>
    ${opts.message ? `<p>${escapeHtml(opts.message)}</p>` : ''}
    <p>This is a reminder regarding your case${c.nextHearingDate ? `. The next hearing is on <strong>${fmt(c.nextHearingDate)}</strong>.` : '.'}</p>
    ${details}
    <p style="color:#64748b;font-size:12px;">Sent by ${escapeHtml(c.advocate?.name || 'your advocate')}.</p>
  </div>`

  const subject = `Case Reminder — ${c.caseNumber}${c.nextHearingDate ? ` (Hearing ${fmt(c.nextHearingDate)})` : ''}`
  const recipients = Array.from(new Set([c.clientEmail, c.advocate?.email].filter((e): e is string => Boolean(e))))
  const results = await Promise.all(recipients.map((to) => sendEmail({ to, subject, htmlContent: html })))
  const delivered = results.some((r) => r.success)
  if (!process.env.BREVO_API_KEY) console.log(`[case-reminder] ${c.caseNumber} → ${recipients.join(', ')} (no mail provider; logged)`)
  return { success: true, delivered, recipients }
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
