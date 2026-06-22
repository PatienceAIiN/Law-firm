import { prisma } from './prisma'

const ADMIN_KEY = 'gmail_account'
const ADMIN_REDIRECT = '/api/admin/mail/callback'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export type GmailAccount = {
  email: string
  accessToken: string
  refreshToken: string
  expiry: number // epoch ms
}

// Per-advocate accounts are stored under a distinct settings key.
export function advocateMailKey(advocateId: string) {
  return `gmail_account_adv_${advocateId}`
}

export function gmailConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function gmailRedirectUri(redirectPath = ADMIN_REDIRECT) {
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${redirectPath}`
}

export function gmailAuthUrl(state = '', redirectPath = ADMIN_REDIRECT) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: gmailRedirectUri(redirectPath),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function readAccount(key = ADMIN_KEY): Promise<GmailAccount | null> {
  const s = await prisma.siteSetting.findUnique({ where: { key } })
  if (!s) return null
  try {
    return JSON.parse(s.value) as GmailAccount
  } catch {
    return null
  }
}

async function writeAccount(acc: GmailAccount, key = ADMIN_KEY) {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(acc) },
    create: { key, value: JSON.stringify(acc) },
  })
}

export async function clearGmailAccount(key = ADMIN_KEY) {
  await prisma.siteSetting.deleteMany({ where: { key } })
}

export async function getConnectedEmail(key = ADMIN_KEY): Promise<string | null> {
  const acc = await readAccount(key)
  return acc?.email || null
}

// Exchange an OAuth code for tokens and persist the account under `key`.
export async function exchangeCodeAndStore(code: string, key = ADMIN_KEY, redirectPath = ADMIN_REDIRECT) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: gmailRedirectUri(redirectPath),
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed: ' + (await res.text()))
  const data = await res.json()

  const profileRes = await fetch(`${GMAIL_API}/profile`, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  const profile = profileRes.ok ? await profileRes.json() : {}

  await writeAccount({
    email: profile.emailAddress || 'unknown',
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiry: Date.now() + (data.expires_in || 3600) * 1000,
  }, key)
  return profile.emailAddress as string
}

async function validAccessToken(key = ADMIN_KEY): Promise<string> {
  const acc = await readAccount(key)
  if (!acc) throw new Error('GMAIL_NOT_CONNECTED')
  if (Date.now() < acc.expiry - 60_000) return acc.accessToken

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: acc.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  const updated: GmailAccount = { ...acc, accessToken: data.access_token, expiry: Date.now() + (data.expires_in || 3600) * 1000 }
  await writeAccount(updated, key)
  return updated.accessToken
}

async function api(path: string, init: RequestInit | undefined, key = ADMIN_KEY) {
  const token = await validAccessToken(key)
  const res = await fetch(`${GMAIL_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) throw new Error(`Gmail API ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

function header(headers: any[], name: string) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
}

export type MailListItem = {
  id: string; threadId: string; from: string; to: string; subject: string; snippet: string; date: string; unread: boolean
}

export async function listMessages(opts: { q?: string; labelId?: string; pageToken?: string; max?: number }, key = ADMIN_KEY) {
  const params = new URLSearchParams({ maxResults: String(opts.max || 25) })
  if (opts.q) params.set('q', opts.q)
  if (opts.labelId) params.set('labelIds', opts.labelId)
  if (opts.pageToken) params.set('pageToken', opts.pageToken)

  const list = await api(`/messages?${params.toString()}`, undefined, key)
  const ids: string[] = (list.messages || []).map((m: any) => m.id)
  const items: MailListItem[] = await Promise.all(
    ids.map(async (id) => {
      const m = await api(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, undefined, key)
      const headers = m.payload?.headers || []
      return {
        id: m.id, threadId: m.threadId,
        from: header(headers, 'From'), to: header(headers, 'To'),
        subject: header(headers, 'Subject'), snippet: m.snippet || '',
        date: header(headers, 'Date'), unread: (m.labelIds || []).includes('UNREAD'),
      }
    }),
  )
  return { items, nextPageToken: list.nextPageToken || null }
}

function decodeBody(payload: any): { html: string; text: string } {
  let html = ''
  let text = ''
  const walk = (part: any) => {
    if (!part) return
    if (part.mimeType === 'text/html' && part.body?.data) html += b64urlDecode(part.body.data)
    else if (part.mimeType === 'text/plain' && part.body?.data) text += b64urlDecode(part.body.data)
    ;(part.parts || []).forEach(walk)
  }
  walk(payload)
  return { html, text }
}

function b64urlDecode(data: string) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

export async function getMessage(id: string, key = ADMIN_KEY) {
  const m = await api(`/messages/${id}?format=full`, undefined, key)
  const headers = m.payload?.headers || []
  const { html, text } = decodeBody(m.payload)
  return {
    id: m.id, threadId: m.threadId,
    from: header(headers, 'From'), to: header(headers, 'To'),
    subject: header(headers, 'Subject'), date: header(headers, 'Date'),
    html, text, snippet: m.snippet || '', unread: (m.labelIds || []).includes('UNREAD'),
  }
}

export async function markRead(id: string, key = ADMIN_KEY) {
  return api(`/messages/${id}/modify`, { method: 'POST', body: JSON.stringify({ removeLabelIds: ['UNREAD'] }) }, key)
}

export async function trashMessage(id: string, key = ADMIN_KEY) {
  return api(`/messages/${id}/trash`, { method: 'POST' }, key)
}

export type MailAttachment = { filename: string; mimeType: string; data: string } // data = base64

export async function sendMessage(
  opts: { to: string; subject: string; body: string; attachments?: MailAttachment[] },
  key = ADMIN_KEY,
) {
  const atts = opts.attachments || []
  let raw: string
  if (atts.length === 0) {
    raw = [
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      opts.body,
    ].join('\r\n')
  } else {
    const boundary = `bnd_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`
    const parts: string[] = [
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      opts.body,
    ]
    for (const a of atts) {
      const b64 = a.data.replace(/\s/g, '')
      parts.push(
        `--${boundary}`,
        `Content-Type: ${a.mimeType}; name="${a.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${a.filename}"`,
        '',
        // Gmail expects base64 lines wrapped at 76 chars.
        b64.replace(/(.{76})/g, '$1\r\n'),
      )
    }
    parts.push(`--${boundary}--`)
    raw = parts.join('\r\n')
  }
  const encoded = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return api('/messages/send', { method: 'POST', body: JSON.stringify({ raw: encoded }) }, key)
}
