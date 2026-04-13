import type { Metadata } from 'next'
import { CalendarDays, MapPin, Video } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import { BookConsultationBtn } from '@/components/ui/book-consultation-btn'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  return {
    title: 'Consultation',
    description: content.consultation.hero.subtitle,
  }
}

export default async function ConsultationPage() {
  const content = await getSiteContent()
  const section = content.consultation

  return (
    <section className="min-h-full bg-white px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-5 text-center shadow-sm sm:p-8">
          <div className="inline-flex items-center rounded-full border border-[#c5a059]/20 bg-[#c5a059]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a059]">
            {section.hero.badge}
          </div>
          <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-[#0a192f] sm:text-5xl">
            {section.hero.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
            {section.hero.subtitle}
          </p>

          <div className="mt-6 grid gap-3 sm:gap-4">
            {(section.features || []).map((feature: { title: string; desc: string }, index: number) => {
              const Icon = index === 0 ? Video : index === 1 ? MapPin : CalendarDays
              return (
                <div key={feature.title} className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a192f]/5 text-[#0a192f]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#0a192f]">{feature.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <BookConsultationBtn
              label="Book Consultations"
              className="px-5 py-3 text-[11px] shadow-[0_12px_28px_rgba(10,25,47,0.18)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
