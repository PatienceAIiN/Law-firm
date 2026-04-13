import { notFound } from 'next/navigation'
import { MeetingWorkspace } from '@/components/meetings/meeting-workspace'
import { getBookingWithSlot, getMeetingConfig, getMeetingRecordings } from '@/lib/meeting-workspace'

export default async function MeetingPage({ params, searchParams }: { params: Promise<{ bookingId: string }>; searchParams?: Promise<{ admin?: string }> }) {
  const { bookingId } = await params
  const sp = searchParams ? await searchParams : {}
  const adminView = sp?.admin === '1'
  const [booking, meetingConfig, recordings] = await Promise.all([
    getBookingWithSlot(bookingId),
    getMeetingConfig(),
    getMeetingRecordings(),
  ])

  if (!booking) {
    notFound()
  }

  return (
    <MeetingWorkspace
      booking={{
        id: booking.id,
        name: booking.name,
        email: booking.email,
        subject: booking.subject,
        meetingMode: booking.meetingMode,
        meetingLink: booking.meetingLink,
        createdAt: booking.createdAt.toISOString(),
        slot: {
          startTime: booking.slot.startTime.toISOString(),
          endTime: booking.slot.endTime.toISOString(),
          physicalAddress: booking.slot.physicalAddress,
          day: {
            date: booking.slot.day.date.toISOString(),
          },
        },
      }}
      meetingConfig={meetingConfig}
      recordings={recordings.filter((item) => item.bookingId === booking.id)}
      adminView={adminView}
    />
  )
}
