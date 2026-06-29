import { InstantRoom } from './instant-room'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Video consultation' }

export default async function InstantMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>
  searchParams: Promise<{ token?: string; url?: string; name?: string }>
}) {
  const { roomId } = await params
  const sp = await searchParams
  return (
    <InstantRoom
      roomId={roomId}
      token={sp.token || ''}
      serverUrl={sp.url || process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
      displayName={sp.name || 'Guest'}
    />
  )
}
