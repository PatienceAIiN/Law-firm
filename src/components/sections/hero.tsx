import Link from 'next/link'
import { ArrowRight, Award, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroProps {
  data?: {
    badge?: string
    title: string
    subtitle: string
    cta_primary_text: string
    cta_primary_link: string
    cta_secondary_text?: string
    cta_secondary_link?: string
    heroImage?: string
  } | null
  profile?: {
    name: string
    officeDetails: string | null
  } | null
  metrics?: any[]
}

const ICON_MAP: Record<string, any> = {
  Award,
  Users,
  BookOpen,
  TrendingUp: Award,
  Calendar: BookOpen
}

export function Hero({ data, profile, metrics }: HeroProps) {
  const title = data?.title || 'Excellence in Legal Representation'
  const subtitle = data?.subtitle || 'With over two decades of experience, we provide strategic legal solutions.'
  const ctaSecondaryText = data?.cta_secondary_text || 'Learn More'
  const ctaSecondaryLink = data?.cta_secondary_link || '/about'
  const badge = data?.badge || 'Experienced Legal Counsel'
  const heroImage = data?.heroImage

  return (
    <section className="bg-gray-50 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-gray-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-6 text-center shadow-sm sm:p-8 lg:p-10">
          {heroImage && (
            <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-gray-50">
              <img
                src={heroImage}
                alt="Hero Background"
                className="h-56 w-full object-cover opacity-90 sm:h-72"
              />
            </div>
          )}

          <div className="inline-flex items-center rounded-full border border-[#F4E8D8]/20 bg-[#F6F0E8]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#14203E]">
            {badge}
          </div>

          <h1 className="mx-auto mt-5 max-w-5xl text-4xl font-black uppercase tracking-tighter text-[#14203E] sm:text-5xl lg:text-7xl">
            <span className="text-[#14203E]">{title.split(' ').slice(0, 2).join(' ')}</span>{' '}
            <span className="text-[#14203E]">{title.split(' ').slice(2).join(' ')}</span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-2xl bg-[#14203E] px-8 font-black uppercase tracking-widest text-white hover:bg-[#F6F0E8] hover:text-[#14203E]">
              <Link href="/practice-areas">
                Explore Practice Areas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl border-gray-200 px-8 font-black uppercase tracking-widest text-[#14203E] hover:bg-slate-50">
              <Link href={ctaSecondaryLink}>{ctaSecondaryText}</Link>
            </Button>
          </div>

          {metrics && metrics.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {metrics.slice(0, 3).map((m) => {
                const Icon = ICON_MAP[m.icon || 'Award'] || Award
                return (
                  <div key={m.id} className="rounded-[24px] border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 text-left shadow-sm">
                    <Icon className="h-5 w-5 text-[#14203E]" />
                    <div className="mt-4 text-3xl font-black tracking-tighter text-[#14203E]">{m.value}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{m.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
