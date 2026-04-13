import { getMeetingIntegrationStatus } from '@/lib/meeting-providers'
import { IntegrationsClient } from './integrations-client'

export default async function IntegrationsPage() {
  const status = await getMeetingIntegrationStatus()

  const googleConfigured = true
  const zoomConfigured = !!(
    process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET
  )

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0a192f]">
          Meeting Integrations
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
          Connect Jitsi Meet or Zoom to auto-generate real meeting links when consultations are booked.
        </p>
      </div>

      <IntegrationsClient
        googleStatus={status.google}
        zoomStatus={status.zoom}
        googleConfigured={googleConfigured}
        zoomConfigured={zoomConfigured}
      />
    </div>
  )
}
