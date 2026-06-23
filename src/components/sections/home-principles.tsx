import Link from 'next/link'
import { ShieldCheck, Scale, Target } from 'lucide-react'

export function HomePrinciples({ content }: { content?: any }) {
  const section = content?.about?.philosophy || {}
  const values = section.values || []
  const highlights = values.slice(0, 3)
  const icons = [ShieldCheck, Scale, Target]

  return (
    <section className="px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-5 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="space-y-5">
            <div className="inline-flex items-center rounded-full border border-[#F4E8D8]/20 bg-[#F6F0E8]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              {section.badge || 'Our Values'}
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-primary sm:text-5xl">
              {section.heading?.split(' ').slice(0, 2).join(' ') || 'Guided by'} <span className="text-primary">{section.heading?.split(' ').slice(2).join(' ') || 'Core Principles'}</span>
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
              {section.subtitle || 'Our philosophy is built on integrity, excellence, and unwavering commitment to client success.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((value: any, index: number) => {
                const Icon = value.icon || icons[index] || ShieldCheck
                return (
                  <div key={value.title} className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">{value.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-4 inline-flex items-center rounded-full border border-[#F4E8D8]/20 bg-[#F6F0E8]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              {section.missionTitle || 'Our Mission'}
            </div>
            <p className="text-sm leading-7 text-slate-600">
              {section.missionBody || 'To provide exceptional legal services that combine deep expertise with innovative strategies, ensuring clients receive the best possible representation.'}
            </p>
            <div className="mt-6 grid gap-3">
              {(section.missionPoints || []).map((item: any) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-primary">{item.title}</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">{item.subtitle}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/about" className="inline-flex items-center gap-2 rounded-2xl border border-primary bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#F6F0E8] hover:text-primary">
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
