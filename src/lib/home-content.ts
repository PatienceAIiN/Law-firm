import { prisma } from './prisma'

export type HomeFeature = { title: string; desc: string }
export type HomeContent = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  features: HomeFeature[]
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  title: 'A modern way to build your case.',
  subtitle: 'Expert legal counsel, secure virtual consultations, and real-time case tracking — all in one place.',
  ctaLabel: 'Book a Consultation',
  ctaHref: '/consultation',
  features: [
    { title: 'Experienced Advocates', desc: 'Seasoned counsel across corporate, criminal, family and property law.' },
    { title: 'Secure Virtual Meetings', desc: 'Encrypted live video consultations from anywhere.' },
    { title: 'Track Your Case', desc: 'Check status, hearings and notes anytime with OTP-verified access.' },
  ],
}

export async function getHomeContent(): Promise<HomeContent> {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { key: 'home_content' } })
    if (!s?.value) return DEFAULT_HOME_CONTENT
    const parsed = JSON.parse(s.value)
    return {
      ...DEFAULT_HOME_CONTENT,
      ...parsed,
      features: Array.isArray(parsed.features) && parsed.features.length ? parsed.features : DEFAULT_HOME_CONTENT.features,
    }
  } catch {
    return DEFAULT_HOME_CONTENT
  }
}
