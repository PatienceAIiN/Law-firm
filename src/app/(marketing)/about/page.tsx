import type { Metadata } from 'next'
import { ExperienceSection } from '@/components/pages/about/experience-section'
import { TeamSection } from '@/components/pages/about/team-section'
import { PhilosophySection } from '@/components/pages/about/philosophy-section'
import { Testimonials } from '@/components/sections/testimonials'
import { SectionWrapper } from '@/components/ui/animation-wrapper'
import { prisma } from '@/lib/prisma'
import { getSiteContent } from '@/lib/site-content'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  return {
    title: 'About Us',
    description: content.about.hero.subtitle,
  }
}

export default async function AboutPage() {
  const [profile, metrics, testimonials, teamMembers] = await Promise.all([
    (prisma as any).aboutProfile?.findUnique({ where: { id: 'default-profile' } }) || null,
    (prisma as any).siteMetric?.findMany({ orderBy: { order: 'asc' } }) || [],
    (prisma as any).testimonial?.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) || [],
    (prisma as any).teamMember?.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) || [],
  ])
  const content = await getSiteContent()

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#c5a059]">About Us</p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tighter text-[#0a192f] sm:text-5xl">
            Beyond <span className="text-[#c5a059]">Legal Boundaries</span>
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-lg">
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
