import type { Metadata } from 'next'
import { CalendarDays, MapPin, Video } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import { BookConsultationBtn } from '@/components/ui/book-consultation-btn'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'

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
    <div className="-mt-3 sm:-mt-4">
      {/* Hero with live video cover — same language as the Articles page */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#FFFCF8] dark:bg-[#0b0f17]">
        <VideoCover src={COVER_VIDEOS.consultation} />
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 py-24 text-center">
          <div className="inline-flex items-center rounded-full border border-[#F4E8D8] bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#14203E] dark:border-white/15 dark:bg-white/10 dark:text-white">
            {section.hero.badge}
          </div>
          <h1 className="mt-5 text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px]">
            {section.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70 sm:text-[22px]">
            {section.hero.subtitle}
          </p>
          <div className="mt-9">
            <BookConsultationBtn label="Book Consultation" className="px-6 py-3.5 text-[12px]" />
          </div>
        </div>
      </section>

      {/* Modes section */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-white dark:bg-[#0b0f17]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="mx-auto mb-14 flex max-w-[640px] items-center gap-6">
            <span className="h-px flex-1 bg-[#14203E] dark:bg-white/20" />
            <span className="whitespace-nowrap text-[14px] font-medium uppercase tracking-wide text-[#14203E] dark:text-white/80">
              How we meet
            </span>
            <span className="h-px flex-1 bg-[#14203E] dark:bg-white/20" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(section.features || []).map((feature: { title: string; desc: string }, index: number) => {
              const Icon = index === 0 ? Video : index === 1 ? MapPin : CalendarDays
              return (
                <div key={feature.title} className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-7 transition-colors dark:border-white/10 dark:bg-[#11151f]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#14203E] text-white dark:bg-white dark:text-[#14203E]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-[18px] font-semibold text-[#14203E] dark:text-white">{feature.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#14203E]/65 dark:text-white/60">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
