import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { PracticeAreas } from '@/components/sections/practice-areas'
import { getSiteContent } from '@/lib/site-content'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Practice Areas',
    description: 'Explore the legal practice areas covered by our firm.',
  }
}

export default async function PracticeAreasPage() {
  const practiceAreas = await prisma.practiceArea.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
  const content = await getSiteContent()

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#14203E]">
            {content.practiceAreasPage?.badge || 'Practice Areas'}
          </p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tighter text-[#14203E] sm:text-5xl">
            {content.practiceAreasPage?.title || 'Browse Legal Services'}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-lg">
            {content.practiceAreasPage?.subtitle || 'Explore the legal services we offer and open the relevant detail panel for each area.'}
          </p>
        </div>
      </section>

      <PracticeAreas data={practiceAreas} content={content} />
    </div>
  )
}
