import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getMeetingConfig, getMeetingRecordings } from '@/lib/meeting-workspace'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'
import { Calendar, Clock, FileVideo, MonitorPlay, Video, ShieldAlert, Plus, Send, Trash2 } from 'lucide-react'
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

  const isPhysical = meetingMode === 'PHYSICAL'

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
    data: {
      dayId: day.id, startTime, endTime, capacity: 1, bookedCount: 1, isActive: true,
      allowedModes: meetingMode,
      physicalAddress: isPhysical ? (meetingLink || null) : null,
    }
  })

  // Create booking (link filled in below once we know the booking id)
  const booking = await prisma.consultationBooking.create({
    data: { slotId: slot.id, name, email, phone: phone || '', subject, meetingMode, status: 'CONFIRMED' }
  })

  // Auto-generate a live working video link for virtual meetings.
  const baseUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const workspaceUrl = `${baseUrl}/meeting/${booking.id}`
  const storedLink = isPhysical ? (meetingLink || null) : workspaceUrl

  await prisma.consultationBooking.update({
    where: { id: booking.id },
    data: { meetingLink: storedLink },
  })

  const dateFormatted = new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const modeLabel = isPhysical ? 'In-Person' : 'Virtual (Live Video)'
  const locationRow = isPhysical
    ? `<p style="margin:4px 0;color:#14203E;"><strong>Address:</strong> ${meetingLink || 'To be shared by our team'}</p>`
    : ''

  // 1) Email the client
  await sendEmail({
    to: email,
    subject: `Meeting Scheduled: ${subject}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFFCF8;border-radius:16px;">
        <h2 style="color:#14203E;margin-bottom:8px;">Meeting Confirmed</h2>
        <p style="color:#475569;">Dear ${name},</p>
        <p style="color:#475569;">Your consultation has been scheduled.</p>
        <div style="background:white;border:1px solid #F4E8D8;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#14203E;"><strong>Date:</strong> ${dateFormatted}</p>
          <p style="margin:4px 0;color:#14203E;"><strong>Time:</strong> ${startTimeStr} – ${endTimeStr} IST</p>
          <p style="margin:4px 0;color:#14203E;"><strong>Type:</strong> ${modeLabel}</p>
          <p style="margin:4px 0;color:#14203E;"><strong>Subject:</strong> ${subject}</p>
          ${locationRow}
        </div>
        ${isPhysical
          ? `<p style="color:#475569;">Please arrive at the address above a few minutes early.</p>`
          : `<p style="color:#475569;">Join your meeting using the secure live video workspace below. Please do not share this link.</p>
        <a href="${workspaceUrl}" style="display:inline-block;background:#14203E;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin:16px 0;">
          Join Live Meeting
        </a>`}
        <p style="color:#64748b;font-size:12px;margin-top:24px;">For any queries, reply to this email.</p>
      </div>`,
    textContent: `Meeting Confirmed\n\nDear ${name},\n\nDate: ${dateFormatted}\nTime: ${startTimeStr} - ${endTimeStr} IST\nType: ${modeLabel}\nSubject: ${subject}\n${isPhysical ? `Address: ${meetingLink || 'TBD'}` : `Join here: ${workspaceUrl}`}`,
  })

  // 2) Notify the admin/firm
  const admin = await prisma.adminUser.findFirst({ select: { email: true } }).catch(() => null)
  const adminEmail = admin?.email || process.env.BREVO_SENDER_EMAIL
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New ${modeLabel} meeting scheduled — ${name}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFFCF8;border-radius:16px;">
          <h2 style="color:#14203E;margin-bottom:8px;">Meeting Scheduled</h2>
          <div style="background:white;border:1px solid #F4E8D8;border-radius:12px;padding:20px;margin:16px 0;">
            <p style="margin:4px 0;color:#14203E;"><strong>Client:</strong> ${name} (${email}${phone ? `, ${phone}` : ''})</p>
            <p style="margin:4px 0;color:#14203E;"><strong>Date:</strong> ${dateFormatted}, ${startTimeStr}–${endTimeStr} IST</p>
            <p style="margin:4px 0;color:#14203E;"><strong>Type:</strong> ${modeLabel}</p>
            <p style="margin:4px 0;color:#14203E;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin:4px 0;color:#14203E;"><strong>${isPhysical ? 'Address' : 'Live link'}:</strong> ${isPhysical ? (meetingLink || 'TBD') : `<a href="${workspaceUrl}">${workspaceUrl}</a>`}</p>
          </div>
          ${!isPhysical ? `<a href="${baseUrl}/meeting/${booking.id}?admin=1" style="display:inline-block;background:#14203E;color:white;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:600;">Open Admin View</a>` : ''}
        </div>`,
      textContent: `Meeting scheduled\nClient: ${name} (${email})\n${dateFormatted} ${startTimeStr}-${endTimeStr} IST\nType: ${modeLabel}\nSubject: ${subject}\n${isPhysical ? `Address: ${meetingLink || 'TBD'}` : `Link: ${workspaceUrl}`}`,
    })
  }

  // 3) Log it to the meeting activity log so the admin is notified in-panel.
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'meeting_activity_log' } })
    const events = setting ? (JSON.parse(setting.value) as any[]) : []
    events.unshift({
      id: `evt-${booking.id}`,
      bookingId: booking.id,
      type: 'MEETING_SCHEDULED',
      details: `${modeLabel} meeting scheduled for ${name} on ${dateFormatted} ${startTimeStr}–${endTimeStr}`,
      timestamp: new Date().toISOString(),
    })
    await prisma.siteSetting.upsert({
      where: { key: 'meeting_activity_log' },
      update: { value: JSON.stringify(events.slice(0, 200)) },
      create: { key: 'meeting_activity_log', value: JSON.stringify(events) },
    })
  } catch {}

  revalidatePath('/admin/virtual-meetings')
}

// Cancel + delete a scheduled meeting (frees the slot seat).
async function deleteMeeting(formData: FormData) {
  'use server'
  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return
  const booking = await prisma.consultationBooking.findUnique({ where: { id: bookingId } })
  if (!booking) return

  await prisma.$transaction(async (tx) => {
    await tx.consultationBooking.delete({ where: { id: bookingId } })
    await tx.availabilitySlot.update({
      where: { id: booking.slotId },
      data: { bookedCount: { decrement: 1 } },
    }).catch(() => {})
  })

  // Notify the client their meeting was cancelled.
  if (booking.email) {
    await sendEmail({
      to: booking.email,
      subject: `Meeting Cancelled: ${booking.subject || 'Consultation'}`,
      htmlContent: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#14203E;">Meeting Cancelled</h2>
        <p>Dear ${booking.name}, your scheduled consultation has been cancelled by our team. Please reach out to reschedule.</p>
      </div>`,
    }).catch(() => {})
  }

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
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#14203E]">Virtual Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule meetings, launch secure workspaces, review recordings and activity.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F4E8D8] bg-[#FFFCF8]">
          <MonitorPlay className="w-4 h-4 text-[#64748b]" />
          <span className="text-sm font-semibold text-[#14203E]">Storage: {meetingConfig.storageMode}</span>
        </div>
      </div>

      {/* Manual Scheduler */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Plus className="w-5 h-5 text-[#64748b]" />
          <h2 className="text-lg font-bold text-[#14203E]">Schedule Meeting Manually</h2>
        </div>
        <ManualScheduler scheduleAction={scheduleManualMeeting} />
      </section>

      {/* Activity Log */}
      {activityEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-[#14203E]">Meeting Activity Log</h2>
            <span className="text-xs text-gray-400">{activityEvents.length} events</span>
          </div>
          <ActivityLogPanel events={activityEvents} bookings={bookings as any} />
        </section>
      )}

      <div className="border-t border-[#F4E8D8]" />

      {/* Booking list */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Video className="w-5 h-5 text-[#64748b]" />
          <h2 className="text-lg font-bold text-[#14203E]">All Consultation Bookings</h2>
        </div>
        <div className="space-y-4">
          {bookings.map((booking) => {
            const bookingRecordings = recordings.filter(r => r.bookingId === booking.id)
            return (
              <div key={booking.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#14203E] p-2.5">
                        <Video className="w-4 h-4 text-[#14203E]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#14203E]">{booking.name}</h3>
                        <p className="text-xs text-[#64748b] font-medium">{booking.meetingMode.replace('_', ' ')} · {booking.status}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#14203E]" />{formatDate(booking.slot.day.date)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#14203E]" />{formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{booking.subject}</p>
                    {booking.meetingLink && (
                      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        {booking.meetingMode === 'PHYSICAL' ? (
                          <span><strong>Address:</strong> {booking.meetingLink}</span>
                        ) : (
                          <a href={booking.meetingLink} className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline break-all">
                            <Video className="w-3.5 h-3.5" /> {booking.meetingLink}
                          </a>
                        )}
                      </div>
                    )}
                    {bookingRecordings.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <FileVideo className="w-3.5 h-3.5" />{bookingRecordings.length} recording(s) saved
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`/meeting/${booking.id}?admin=1`} target="_blank" rel="noopener noreferrer"
                      className="rounded-xl bg-[#14203E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d2c52] transition-colors">
                      Join Meeting
                    </a>
                    <a href={`/meeting/${booking.id}`} target="_blank" rel="noopener noreferrer"
                      className="rounded-xl border border-[#F4E8D8] px-4 py-2 text-xs font-semibold text-[#14203E] hover:bg-[#FFFCF8] transition-colors">
                      Client Link
                    </a>
                    <form action={deleteMeeting}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button type="submit"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Cancel & Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#F4E8D8] p-12 text-center">
              <p className="text-sm text-gray-400">No bookings yet. Use the scheduler above to create one.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
