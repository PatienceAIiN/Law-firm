import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Hero } from '@/components/sections/hero'
import { AboutSection } from '@/components/sections/about-section'
import { HomePrinciples } from '@/components/sections/home-principles'
import { ContactCTA } from '@/components/sections/contact-cta'
import { Loader2 } from 'lucide-react'
import { SectionWrapper } from '@/components/ui/animation-wrapper'
import { getSiteContent } from '@/lib/site-content'

// Separate data-fetching components for streaming
async function DynamicAbout() {
  const [profile, metrics] = await Promise.all([
    (prisma as any).aboutProfile?.findUnique({ where: { id: 'default-profile' } }) || null,
    (prisma as any).siteMetric?.findMany({ orderBy: { order: 'asc' } }) || []
  ])
  const content = await getSiteContent()
  return (
    <SectionWrapper>
      <AboutSection data={profile} metrics={metrics} content={content} />
    </SectionWrapper>
  )
}

async function DynamicContactCTA() {
  const [profile, metrics] = await Promise.all([
    (prisma as any).aboutProfile?.findUnique({ where: { id: 'default-profile' } }) || null,
    (prisma as any).siteMetric?.findMany({ orderBy: { order: 'asc' } }) || []
  ])
  const officeDetails = profile?.officeDetails ? JSON.parse(profile.officeDetails) : null
  const content = await getSiteContent()
  return (
    <SectionWrapper>
      <ContactCTA contact={officeDetails} metrics={metrics} content={content} />
    </SectionWrapper>
  )
}

function SectionSkeleton() {
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center opacity-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#c5a059]" />
      <span className="text-[10px] font-bold uppercase tracking-widest mt-4">Loading Section...</span>
    </div>
  )
}

export default async function HomePage() {
  // Fetch Hero, Profile, and Metrics immediately with safety checks
  const [heroSetting, profile, metrics] = await Promise.all([
    (prisma as any).siteSetting?.findUnique({ where: { key: 'hero_content' } }) || null,
    (prisma as any).aboutProfile?.findUnique({ where: { id: 'default-profile' } }) || null,
    (prisma as any).siteMetric?.findMany({ orderBy: { order: 'asc' } }) || []
  ])
  const content = await getSiteContent()

  const hero = (() => {
    if (!heroSetting?.value) return null
    try {
      return JSON.parse(heroSetting.value)
    } catch {
      return null
    }
  })()

  return (
    <div className="space-y-0 overflow-hidden">
      <Hero data={hero} profile={profile} metrics={metrics} />
      
      <Suspense fallback={<SectionSkeleton />}>
        <DynamicAbout />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HomePrinciples content={content} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DynamicContactCTA />
      </Suspense>
    </div>
  )
}
