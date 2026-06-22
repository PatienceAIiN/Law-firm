import type { Metadata } from 'next'
import { ExperienceSection } from '@/components/pages/about/experience-section'
import { TeamSection } from '@/components/pages/about/team-section'
import { PhilosophySection } from '@/components/pages/about/philosophy-section'
import { Testimonials } from '@/components/sections/testimonials'
import { SectionWrapper } from '@/components/ui/animation-wrapper'
import { prisma } from '@/lib/prisma'
import { getSiteContent } from '@/lib/site-content'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  return {
    title: 'About Us',
    description: content.about.hero.subtitle,
  }
}

export default async function AboutPage() {
  let profile = null, metrics: any[] = [], testimonials: any[] = [], teamMembers: any[] = []
  try {
    ;[profile, metrics, testimonials, teamMembers] = await Promise.all([
      (prisma as any).aboutProfile?.findUnique({ where: { id: 'default-profile' } }) || null,
      (prisma as any).siteMetric?.findMany({ orderBy: { order: 'asc' } }) || [],
      (prisma as any).testimonial?.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) || [],
      (prisma as any).teamMember?.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) || [],
    ])
  } catch {}
  const content = await getSiteContent()

  return (
    <div className="-mt-3 min-h-screen bg-white dark:bg-[#0b0f17] sm:-mt-4">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#FFFCF8] dark:bg-[#0b0f17]">
        <VideoCover src={COVER_VIDEOS.about} />
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 py-24 text-center">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px]">
            Beyond Legal Boundaries
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70 sm:text-[22px]">
            {content.about.hero.subtitle}
          </p>
        </div>
      </section>

      <ExperienceSection data={profile} content={content} />
      <PhilosophySection content={content} />
      <SectionWrapper>
        <Testimonials data={testimonials} metrics={metrics} content={content} />
      </SectionWrapper>
      <TeamSection content={content} members={teamMembers} />
    </div>
  )
}
