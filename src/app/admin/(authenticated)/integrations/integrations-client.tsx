'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Video,
  CheckCircle2,
  XCircle,
  Link2,
  Link2Off,
  AlertCircle,
  Loader2,
  Settings,
  ExternalLink,
} from 'lucide-react'

interface ProviderStatus {
  connected: boolean
  savedAt: string | null
  expiresAt: string | null
}

interface IntegrationsClientProps {
  googleStatus: ProviderStatus
  zoomStatus: ProviderStatus
  googleConfigured: boolean
  zoomConfigured: boolean
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

function ProviderCard({
  name,
  icon,
  accentColor,
  status,
  configured,
  connectHref,
  disconnectEndpoint,
  description,
  setupNote,
}: {
  name: string
  icon: React.ReactNode
  accentColor: string
  status: ProviderStatus
  configured: boolean
  connectHref: string
  disconnectEndpoint: string
  description: string
  setupNote?: string
}) {
  const [disconnecting, setDisconnecting] = useState(false)
  const router = useRouter()

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${name}? Future bookings will use generated placeholder links.`)) return
    setDisconnecting(true)
    try {
      const res = await fetch(disconnectEndpoint, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-6 flex items-center justify-between ${accentColor}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{name}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.connected ? (
            <span className="flex items-center gap-2 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 bg-black/20 text-white/70 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
              <XCircle className="w-3.5 h-3.5" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {!configured && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">API credentials not configured</p>
              {setupNote && (
                <p className="text-xs text-amber-600 mt-1">{setupNote}</p>
              )}
            </div>
          </div>
        )}

        {status.connected && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Connected On
              </div>
              <div className="text-sm font-bold text-[#0a192f]">{formatDate(status.savedAt)}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Token Expires
              </div>
              <div className="text-sm font-bold text-[#0a192f]">{formatDate(status.expiresAt)}</div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#f8fafc] border border-gray-100 p-4 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            How it works
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {status.connected
              ? `${name} is connected. When a client books a consultation with this mode, a real meeting link is automatically created and emailed to both the client and the firm.`
              : `Connect ${name} to auto-create meetings on booking. The authentication token is stored securely in the database and persists across admin logouts.`}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {status.connected ? (
            <>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-200 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2Off className="w-4 h-4" />
                )}
                {disconnecting ? 'Disconnecting...' : 'Delink Account'}
              </button>
              {configured && (
                <a
                  href={connectHref}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-[#0a192f] font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Reconnect
                </a>
              )}
            </>
          ) : (
            <a
              href={configured ? connectHref : '#'}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                configured
                  ? 'bg-[#0a192f] text-white hover:bg-[#0a192f]/90 shadow-lg shadow-[#0a192f]/20'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={(e) => !configured && e.preventDefault()}
            >
              <Link2 className="w-4 h-4" />
              {configured ? 'Connect Account' : 'Configure Credentials First'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function IntegrationsClient({
  googleStatus,
  zoomStatus,
  googleConfigured,
  zoomConfigured,
}: IntegrationsClientProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* How it all works */}
      <div className="rounded-[2rem] bg-[#0a192f] p-6 text-white space-y-3">
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5 text-[#c5a059]" />
          <h3 className="font-black uppercase tracking-widest text-sm">Auto Meeting Link Generation</h3>
        </div>
        <p className="text-sm text-white/70 font-medium leading-relaxed">
          When a client books a consultation and selects Google Meet or Zoom, the system automatically
          creates a real meeting link via the connected account. The link is emailed to both the
          client and the firm instantly. Authentication is stored permanently in the database —
          even after logout — until you explicitly delink it.
        </p>
        <div className="grid grid-cols-3 gap-4 pt-2">
          {[
            { step: '01', label: 'Admin connects account once' },
            { step: '02', label: 'Client books → real link auto-created' },
            { step: '03', label: 'Email sent to client + firm' },
          ].map(({ step, label }) => (
            <div key={step} className="rounded-2xl bg-white/10 p-3 text-center">
              <div className="text-[#c5a059] font-black text-lg">{step}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <ProviderCard
        name="Google Meet"
        icon={<Video className="w-6 h-6 text-white" />}
        accentColor="bg-[#1a73e8]"
        status={googleStatus}
        configured={googleConfigured}
        connectHref="/api/auth/google-meet/connect"
        disconnectEndpoint="/api/auth/google-meet/disconnect"
        description="Auto-create Google Meet links via Google Calendar API"
        setupNote="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local file. Set the OAuth callback URL to: {NEXTAUTH_URL}/api/auth/google-meet/callback"
      />

      <ProviderCard
        name="Zoom"
        icon={<Video className="w-6 h-6 text-white" />}
        accentColor="bg-[#2D8CFF]"
        status={zoomStatus}
        configured={zoomConfigured}
        connectHref="/api/auth/zoom/connect"
        disconnectEndpoint="/api/auth/zoom/disconnect"
        description="Auto-create Zoom meetings via Zoom OAuth API"
        setupNote="Add ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET to your .env.local file. Set the OAuth redirect URL to: {NEXTAUTH_URL}/api/auth/zoom/callback"
      />

      {/* Setup guide */}
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 space-y-4">
        <h3 className="font-black uppercase tracking-widest text-sm text-[#0a192f]">Setup Guide</h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-black text-[#0a192f] mb-1">Google Meet Setup</div>
            <ol className="list-decimal ml-4 space-y-1 text-gray-600 font-medium">
              <li>Go to Google Cloud Console → APIs &amp; Services → Credentials</li>
              <li>Create an OAuth 2.0 Client ID (Web application)</li>
              <li>Add <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{NEXTAUTH_URL}'}/api/auth/google-meet/callback</code> as an authorized redirect URI</li>
              <li>Enable the Google Calendar API in your project</li>
              <li>Copy Client ID + Secret to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code></li>
            </ol>
          </div>
          <div>
            <div className="font-black text-[#0a192f] mb-1">Zoom Setup</div>
            <ol className="list-decimal ml-4 space-y-1 text-gray-600 font-medium">
              <li>Go to Zoom Marketplace → Develop → Build App → OAuth</li>
              <li>Add <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{NEXTAUTH_URL}'}/api/auth/zoom/callback</code> as redirect URL</li>
              <li>Add scopes: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">meeting:write:admin</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">user:read:admin</code></li>
              <li>Copy Client ID + Secret to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
