import { randomUUID } from 'crypto'
import { prisma } from './prisma'
import { sanitizeConfigValue } from './storage'

// ─── Google Meet ────────────────────────────────────────────────────────────

export function getGoogleOAuthUrl(baseUrl: string): string {
  const redirectUri = `${baseUrl}/api/auth/google-meet/callback`
  const clientId = sanitizeConfigValue(process.env.GOOGLE_CLIENT_ID)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(code: string, baseUrl: string) {
  const redirectUri = `${baseUrl}/api/auth/google-meet/callback`
  const clientId = sanitizeConfigValue(process.env.GOOGLE_CLIENT_ID)
  const clientSecret = sanitizeConfigValue(process.env.GOOGLE_CLIENT_SECRET)
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  return response.json()
}

export async function saveGoogleTokens(tokens: Record<string, any>) {
  const value = JSON.stringify({
    provider: 'jitsi',
    connected: true,
    ...tokens,
    expires_at: tokens.expires_at || new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    saved_at: new Date().toISOString(),
  })
  await prisma.siteSetting.upsert({
    where: { key: 'google_meet_auth' },
    update: { value },
    create: { key: 'google_meet_auth', value },
  })
}

export async function getGoogleTokens(): Promise<Record<string, any> | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'google_meet_auth' } })
  if (!setting) return null
  try {
    return JSON.parse(setting.value)
  } catch {
    return null
  }
}

export async function disconnectGoogle() {
  await prisma.siteSetting.deleteMany({ where: { key: 'google_meet_auth' } })
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<Record<string, any> | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    const data = await response.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

async function getValidGoogleToken(): Promise<string | null> {
  let tokens = await getGoogleTokens()
  if (!tokens?.access_token) return null

  // Refresh if expired (with 60s buffer)
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0
  if (expiresAt < Date.now() + 60_000) {
    if (!tokens.refresh_token) return null
    const refreshed = await refreshGoogleAccessToken(tokens.refresh_token)
    if (!refreshed?.access_token) return null
    tokens = {
      ...tokens,
      access_token: refreshed.access_token,
      expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(),
    }
    await saveGoogleTokens(tokens)
  }
  return tokens.access_token
}

export async function createGoogleMeetEvent(data: {
  summary: string
  description?: string
  startISO: string  // ISO 8601 with timezone
  endISO: string
  attendeeEmails: string[]
}): Promise<string | null> {
  const room = data.summary
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const seed = `${room || 'consultation'}-${new Date(data.startISO).getTime().toString(36)}-${randomUUID().slice(0, 8)}`
  return `https://meet.jit.si/${seed}`
}

export async function getGoogleAccountInfo(): Promise<{ email?: string; name?: string } | null> {
  const accessToken = await getValidGoogleToken()
  if (!accessToken) {
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'google_meet_auth' } })
    return setting ? { name: 'Jitsi Meet' } : null
  }
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await r.json()
    return { email: data.email, name: data.name }
  } catch {
    return null
  }
}

// ─── Zoom ────────────────────────────────────────────────────────────────────

export function getZoomOAuthUrl(baseUrl: string): string {
  const redirectUri = `${baseUrl}/api/auth/zoom/callback`
  const clientId = sanitizeConfigValue(process.env.ZOOM_CLIENT_ID)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
  })
  return `https://zoom.us/oauth/authorize?${params}`
}

export async function exchangeZoomCode(code: string, baseUrl: string) {
  const redirectUri = `${baseUrl}/api/auth/zoom/callback`
  const clientId = sanitizeConfigValue(process.env.ZOOM_CLIENT_ID)
  const clientSecret = sanitizeConfigValue(process.env.ZOOM_CLIENT_SECRET)
  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString('base64')
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  return response.json()
}

export async function saveZoomTokens(tokens: Record<string, any>) {
  const value = JSON.stringify({
    ...tokens,
    expires_at: tokens.expires_at || new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    saved_at: new Date().toISOString(),
  })
  await prisma.siteSetting.upsert({
    where: { key: 'zoom_auth' },
    update: { value },
    create: { key: 'zoom_auth', value },
  })
}

export async function getZoomTokens(): Promise<Record<string, any> | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'zoom_auth' } })
  if (!setting) return null
  try {
    return JSON.parse(setting.value)
  } catch {
    return null
  }
}

export async function disconnectZoom() {
  await prisma.siteSetting.deleteMany({ where: { key: 'zoom_auth' } })
}

async function refreshZoomAccessToken(refreshToken: string): Promise<Record<string, any> | null> {
  try {
    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64')
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    const data = await response.json()
    if (data.error) return null
    return data
  } catch {
    return null
  }
}

async function getValidZoomToken(): Promise<string | null> {
  let tokens = await getZoomTokens()
  if (!tokens?.access_token) return null

  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0
  if (expiresAt < Date.now() + 60_000) {
    if (!tokens.refresh_token) return null
    const refreshed = await refreshZoomAccessToken(tokens.refresh_token)
    if (!refreshed?.access_token) return null
    tokens = {
      ...tokens,
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || tokens.refresh_token,
      expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString(),
    }
    await saveZoomTokens(tokens)
  }
  return tokens.access_token
}

export async function createZoomMeeting(data: {
  topic: string
  startISO: string  // ISO 8601
  durationMinutes: number
  agenda?: string
}): Promise<string | null> {
  const accessToken = await getValidZoomToken()
  if (!accessToken) return null

  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: data.topic,
        type: 2, // Scheduled meeting
        start_time: data.startISO,
        duration: data.durationMinutes,
        agenda: data.agenda || '',
        timezone: 'Asia/Kolkata',
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          meeting_authentication: false,
        },
      }),
    })

    const meeting = await response.json()
    if (meeting.code) {
      console.error('Zoom API error:', meeting)
      return null
    }
    return meeting.join_url || null
  } catch (err) {
    console.error('Failed to create Zoom meeting:', err)
    return null
  }
}

export async function getZoomAccountInfo(): Promise<{ email?: string; name?: string } | null> {
  const accessToken = await getValidZoomToken()
  if (!accessToken) return null
  try {
    const r = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await r.json()
    return { email: data.email, name: `${data.first_name || ''} ${data.last_name || ''}`.trim() }
  } catch {
    return null
  }
}

// ─── Connection status helpers ────────────────────────────────────────────────

export async function getMeetingIntegrationStatus() {
  const [googleTokens, zoomTokens] = await Promise.all([
    getGoogleTokens(),
    getZoomTokens(),
  ])

  return {
    google: {
      connected: !!googleTokens?.access_token || googleTokens?.provider === 'jitsi' || googleTokens?.connected === true,
      savedAt: googleTokens?.saved_at || null,
      expiresAt: googleTokens?.expires_at || null,
    },
    zoom: {
      connected: !!zoomTokens?.access_token,
      savedAt: zoomTokens?.saved_at || null,
      expiresAt: zoomTokens?.expires_at || null,
    },
  }
}
