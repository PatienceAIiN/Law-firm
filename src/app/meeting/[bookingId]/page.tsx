import { notFound } from 'next/navigation'
import { MeetingRoom } from '@/components/meetings/meeting-room'
import { getBookingWithSlot, getMeetingConfig } from '@/lib/meeting-workspace'

export const dynamic = 'force-dynamic'

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>
  searchParams?: Promise<{ admin?: string }>
}) {
  const { bookingId } = await params
  const sp = searchParams ? await searchParams : {}
  const adminView = sp?.admin === '1'

  const [booking, meetingConfig] = await Promise.all([
    getBookingWithSlot(bookingId),
    getMeetingConfig(),
  ])

  if (!booking) notFound()

  return (
    <MeetingRoom
      booking={{
        id: booking.id,
        name: booking.name,
        email: booking.email,
        subject: booking.subject,
        meetingMode: booking.meetingMode,
        meetingLink: booking.meetingLink,
      }}
      allowRecording={meetingConfig.allowRecording}
      adminView={adminView}
    />
  )
}
