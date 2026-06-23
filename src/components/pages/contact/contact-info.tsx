import { Clock, MapPin } from 'lucide-react'

export function ContactInfo({ contact, content, officeHours = [] }: { contact?: any; content?: any; officeHours?: string[] }) {
  const section = content?.contact?.info || {}

  const hours = officeHours.length > 0
    ? officeHours
    : [
        'Monday - Friday: 9:00 AM - 6:00 PM',
        'Saturday: 10:00 AM - 2:00 PM',
        'Sunday: Closed',
      ]

  return (
    <div className="h-full space-y-6">
      <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-gray-100 bg-gradient-to-b from-white via-slate-50 to-white p-10 shadow-sm">
        <div className="pointer-events-none absolute -left-16 -top-16 h-32 w-32 rounded-full bg-[#F6F0E8]/5" />
        <h3 className="mb-4 text-3xl font-black uppercase tracking-tighter text-[var(--primary)]">
          Get in Touch
        </h3>
        <p className="max-w-md text-sm leading-7 text-slate-600">
          {section.ctaBody || 'Use the form to send your inquiry. Our team will review it and respond promptly with the next steps.'}
        </p>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--primary)]" />
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)]">
              {section.officeHoursHeading || 'Office Hours'}
            </h4>
          </div>
          <div className="space-y-3">
            {hours.map((entry, index) => {
              const separatorIndex = entry.indexOf(':')
              const label = separatorIndex >= 0 ? entry.slice(0, separatorIndex).trim() : entry
              const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1).trim() : ''
              return (
                <div key={`${entry}-${index}`} className="flex items-start justify-between gap-4 border-b border-white/70 py-2 last:border-0">
                  <span className="text-sm font-bold text-[var(--primary)]">{label}</span>
                  <span className="text-sm text-slate-600">{value ? value : 'Closed'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {contact?.mapEmbedUrl && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <MapPin className="h-4 w-4 text-[var(--primary)]" />
              Office Location
            </div>
            <iframe
              src={contact.mapEmbedUrl}
              title="Office location"
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  )
}
