import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContactCTAProps {
  contact?: any
  metrics?: any[]
  content?: any
}

export function ContactCTA({ metrics, content }: ContactCTAProps) {
  const section = content?.home?.contactCta || {}

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fbfcfe] to-white py-20 text-[#14203E]">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(10,25,47,0.05),transparent_26%)]"></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-[#F4E8D8]/30 bg-[#F6F0E8]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#14203E]">
            {section.badge || 'Get Started Today'}
          </div>

          <h2 className="mt-5 text-3xl font-black uppercase tracking-tighter lg:text-5xl">
            {section.title?.split(' ').slice(0, 4).join(' ') || 'Ready to Discuss Your'}{' '}
            <span className="text-[#14203E]">{section.title?.split(' ').slice(4).join(' ') || 'Legal Needs?'}</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 lg:text-lg">
            {section.subtitle || 'Our experienced legal team is here to provide you with strategic counsel and effective representation.'}
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="group h-14 rounded-2xl border border-[#14203E] bg-[#14203E] px-8 font-black uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#F6F0E8] hover:text-[#14203E] hover:shadow-2xl hover:shadow-black/20">
              <Link href="/contact">
                <span>{section.secondaryCtaText || 'Contact Us'}</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {metrics && metrics.length > 0 && (
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
            {metrics.map((m) => (
              <div key={m.id} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-700 shadow-sm">
                {m.value} {m.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
