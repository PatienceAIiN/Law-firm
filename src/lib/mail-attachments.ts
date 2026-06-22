import type { MailAttachment } from './gmail'

const MAX_TOTAL = 20 * 1024 * 1024 // 20 MB combined

// Validates a compose attachment payload: array of { filename, mimeType, data(base64) }.
export function validateAttachments(input: any): { attachments: MailAttachment[]; error?: string } {
  if (!input) return { attachments: [] }
  if (!Array.isArray(input)) return { attachments: [], error: 'Invalid attachments' }

  const attachments: MailAttachment[] = []
  let total = 0
  for (const a of input) {
    if (!a?.filename || !a?.data) return { attachments: [], error: 'Each attachment needs a filename and data' }
    const b64 = String(a.data).replace(/\s/g, '')
    const bytes = Math.floor((b64.length * 3) / 4) // approx decoded size
    total += bytes
    attachments.push({
      filename: String(a.filename).replace(/["\r\n]/g, '').slice(0, 120),
      mimeType: String(a.mimeType || 'application/octet-stream'),
      data: b64,
    })
  }
  if (total > MAX_TOTAL) return { attachments: [], error: 'Attachments exceed the 20 MB limit' }
  return { attachments }
}
