import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getMeetingConfig, getMeetingRecordings } from '@/lib/meeting-workspace'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'
import { Calendar, Clock, FileVideo, MonitorPlay, Video, ShieldAlert, Plus, Send } from 'lucide-react'
import { ManualScheduler } from './manual-scheduler'
import { ActivityLogPanel } from './activity-log-panel'

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(value)
}
function formatTime(value: Date) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(value)
}

async function scheduleManualMeeting(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const subject = formData.get('subject') as string
  const meetingMode = formData.get('meetingMode') as string
  const meetingLink = formData.get('meetingLink') as string
  const dateStr = formData.get('date') as string
  const startTimeStr = formData.get('startTime') as string
  const endTimeStr = formData.get('endTime') as string

  if (!name || !email || !dateStr || !startTimeStr || !endTimeStr) return

  // Create or find an availability day for this date
  const dateObj = new Date(dateStr + 'T00:00:00.000+05:30')
  let day = await prisma.availabilityDay.findFirst({ where: { date: { gte: dateObj, lt: new Date(dateObj.getTime() + 86400000) } } })
  if (!day) {
    day = await prisma.availabilityDay.create({ data: { date: dateObj, isActive: true } })
  }

  // Create slot
  const startTime = new Date(`${dateStr}T${startTimeStr}:00.000+05:30`)
  const endTime = new Date(`${dateStr}T${endTimeStr}:00.000+05:30`)
  const slot = await prisma.availabilitySlot.create({
    data: { dayId: day.id, startTime, endTime, capacity: 1, bookedCount: 1, isActive: true, allowedModes: meetingMode, manualMeetingLink: meetingLink || null }
  })

  // Create booking
  const booking = await prisma.consultationBooking.create({
    data: { slotId: slot.id, name, email, phone: phone || '', subject, meetingMode, meetingLink: meetingLink || null, status: 'CONFIRMED' }
  })

  // Send email to client with workspace link
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const workspaceUrl = `${baseUrl}/meeting/${booking.id}`
  const dateFormatted = new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  await sendEmail({
    to: email,
    subject: `Meeting Scheduled: ${subject}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf8f5;border-radius:16px;">
        <h2 style="color:#1a1208;margin-bottom:8px;">Meeting Confirmed</h2>
        <p style="color:#5c4d38;">Dear ${name},</p>
        <p style="color:#5c4d38;">Your consultation has been scheduled.</p>
        <div style="background:white;border:1px solid #e8e3dc;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1a1208;"><strong>Date:</strong> ${dateFormatted}</p>
          <p style="margin:4px 0;color:#1a1208;"><strong>Time:</strong> ${startTimeStr} – ${endTimeStr} IST</p>
          <p style="margin:4px 0;color:#1a1208;"><strong>Mode:</strong> ${meetingMode.replace('_', ' ')}</p>
          <p style="margin:4px 0;color:#1a1208;"><strong>Subject:</strong> ${subject}</p>
        </div>
        <p style="color:#5c4d38;">Join your meeting using the secure workspace link below. Please do not share this link.</p>
        <a href="${workspaceUrl}" style="display:inline-block;background:#1a1208;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin:16px 0;">
          Join Meeting Workspace
        </a>
        <p style="color:#8c7355;font-size:12px;margin-top:24px;">This meeting will be conducted entirely within our secure workspace. For any queries, reply to this email.</p>
      </div>`,
    textContent: `Meeting Confirmed\n\nDear ${name},\n\nDate: ${dateFormatted}\nTime: ${startTimeStr} - ${endTimeStr} IST\nMode: ${meetingMode}\nSubject: ${subject}\n\nJoin here: ${workspaceUrl}\n\nPlease do not share this link.`,
  })

  revalidatePath('/admin/virtual-meetings')
}

export default async function VirtualMeetingsPage() {
  const [bookings, meetingConfig, recordings] = await Promise.all([
    prisma.consultationBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { slot: { include: { day: true } } },
      take: 30,
    }),
    getMeetingConfig(),
    getMeetingRecordings(),
  ])

  // Get activity log
  let activityEvents: any[] = []
  try {
    const s = await prisma.siteSetting.findUnique({ where: { key: 'meeting_activity_log' } })
    if (s) activityEvents = JSON.parse(s.value)
  } catch {}

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#1a1208]">Virtual Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule meetings, launch secure workspaces, review recordings and activity.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e8e3dc] bg-[#faf8f5]">
          <MonitorPlay className="w-4 h-4 text-[#8c7355]" />
          <span className="text-sm font-semibold text-[#1a1208]">Storage: {meetingConfig.storageMode}</span>
        </div>
      </div>

      {/* Manual Scheduler */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Plus className="w-5 h-5 text-[#8c7355]" />
          <h2 className="text-lg font-bold text-[#1a1208]">Schedule Meeting Manually</h2>
        </div>
        <ManualScheduler scheduleAction={scheduleManualMeeting} />
      </section>

      {/* Activity Log */}
      {activityEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-[#1a1208]">Meeting Activity Log</h2>
            <span className="text-xs text-gray-400">{activityEvents.length} events</span>
          </div>
          <ActivityLogPanel events={activityEvents} bookings={bookings as any} />
        </section>
      )}

      <div className="border-t border-[#e8e3dc]" />

      {/* Booking list */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Video className="w-5 h-5 text-[#8c7355]" />
          <h2 className="text-lg font-bold text-[#1a1208]">All Consultation Bookings</h2>
        </div>
        <div className="space-y-4">
          {bookings.map((booking) => {
            const bookingRecordings = recordings.filter(r => r.bookingId === booking.id)
            return (
              <div key={booking.id} className="rounded-2xl border border-[#e8e3dc] bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#1a1208] p-2.5">
                        <Video className="w-4 h-4 text-[#d4a853]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1a1208]">{booking.name}</h3>
                        <p className="text-xs text-[#8c7355] font-medium">{booking.meetingMode.replace('_', ' ')} · {booking.status}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#d4a853]" />{formatDate(booking.slot.day.date)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#d4a853]" />{formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{booking.subject}</p>
                    {bookingRecordings.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#8c7355]">
                        <FileVideo className="w-3.5 h-3.5" />{bookingRecordings.length} recording(s) saved
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/meeting/${booking.id}`}
                      className="rounded-xl bg-[#1a1208] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d1f0d] transition-colors">
                      Open Workspace
                    </Link>
                    <Link href={`/meeting/${booking.id}?admin=1`}
                      className="rounded-xl border border-[#e8e3dc] px-4 py-2 text-xs font-semibold text-[#1a1208] hover:bg-[#faf8f5] transition-colors">
                      Admin View
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#e8e3dc] p-12 text-center">
              <p className="text-sm text-gray-400">No bookings yet. Use the scheduler above to create one.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
