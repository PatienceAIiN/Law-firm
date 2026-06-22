import { prisma } from '@/lib/prisma'
import { Mail, Phone, Calendar, Clock, MessageSquare, Briefcase, Trash2 } from 'lucide-react'
import { CLIENT_EMAIL_TEMPLATE_OPTIONS } from '@/lib/admin-email-templates'
import { sendClientEmailAction, deleteContactAction, deleteBookingAction } from './actions'

export default async function AdminInbox() {
  const [contacts, bookings] = await Promise.all([
    prisma.contactSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.consultationBooking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        slot: {
          include: {
            day: true,
          },
        },
      },
    })
  ])

  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-2xl font-black text-[#14203E] uppercase tracking-tighter">LEAD INBOX</h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Manage inquiries and booking requests</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Contact Submissions */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <MessageSquare className="w-5 h-5 text-[#14203E]" />
            <h2 className="text-lg font-black text-[#14203E] uppercase tracking-tight">Direct Inquiries</h2>
          </div>

          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#14203E]">{contact.fullName}</h3>
                    <p className="text-xs text-[#14203E] font-bold uppercase tracking-widest">{contact.subject}</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{contact.createdAt.toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-500 mb-6 font-medium line-clamp-2 italic">"{contact.message}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <a href={`mailto:${contact.email}`} className="text-[#14203E] hover:text-[#14203E] transition-colors"><Mail className="w-4 h-4" /></a>
                  {contact.phone && <a href={`tel:${contact.phone}`} className="text-[#14203E] hover:text-[#14203E] transition-colors"><Phone className="w-4 h-4" /></a>}
                  <form action={deleteContactAction} className="ml-auto">
                    <input type="hidden" name="id" value={contact.id} />
                    <button type="submit" className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </form>
                </div>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-center py-12 text-gray-400 font-bold text-xs uppercase tracking-widest">No inquiries yet.</p>}
          </div>
        </section>

        {/* Consultation Bookings */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Calendar className="w-5 h-5 text-[#14203E]" />
            <h2 className="text-lg font-black text-[#14203E] uppercase tracking-tight">Booking Requests</h2>
          </div>

          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-2 h-full ${booking.status === 'PENDING' ? 'bg-[#F6F0E8]' : 'bg-green-500'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#14203E]">{booking.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{booking.meetingMode}</span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                      <span className="text-[10px] font-black uppercase text-[#14203E] tracking-widest">{booking.status}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{booking.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Briefcase className="w-3 h-3 text-[#14203E]" />
                    {booking.subject}
                  </div>
                </div>
                <form action={sendClientEmailAction} className="flex flex-col gap-3 pt-4 border-t border-gray-50 sm:flex-row sm:items-center">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <label className="sr-only" htmlFor={`template-${booking.id}`}>Email template</label>
                  <select
                    id={`template-${booking.id}`}
                    name="templateType"
                    defaultValue="booking_confirmation"
                    className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#14203E] outline-none"
                  >
                    {CLIENT_EMAIL_TEMPLATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-2xl bg-[#14203E] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#F6F0E8] hover:text-[#14203E]">
                    EMAIL CLIENT
                  </button>
                </form>
                <form action={deleteBookingAction} className="mt-3 flex justify-end">
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /> Cancel &amp; Delete</button>
                </form>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-center py-12 text-gray-400 font-bold text-xs uppercase tracking-widest">No bookings yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
