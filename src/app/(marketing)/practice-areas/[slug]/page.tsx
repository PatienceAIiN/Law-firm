import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Briefcase, Scale, Building, Users, FileText, Shield, Home, Gavel, Handshake, Heart, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSiteContent } from '@/lib/site-content'

interface PageProps {
  params: Promise<{ slug: string }>
}

const iconMap: Record<string, any> = {
  Briefcase, Scale, Building, Users, FileText, Shield, Home, Gavel, Handshake, Heart
}

function parseBlocks(content?: string | null) {
  if (!content) return { paragraphs: [] as string[], bullets: [] as string[] }
  const paragraphs = content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const bullets = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-•*]\s+/.test(line))
    .map((line) => line.replace(/^[-•*]\s+/, ''))
  return { paragraphs, bullets }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  let area = null
  try {
    area = await prisma.practiceArea.findUnique({
      where: { slug },
    })
  } catch {}
  if (!area) return { title: 'Not Found' }
  return { title: area.title }
}

export default async function PracticeAreaDetail({ params }: PageProps) {
  const content = await getSiteContent()
  const detailContent = content.practiceAreaDetail || {}
  const { slug } = await params
  let area = null
  try {
    area = await (prisma as any).practiceArea?.findUnique({
      where: { slug },
    })
  } catch {}

  if (!area || !area.isActive) notFound()

  const Icon = iconMap[area.icon || 'Briefcase'] || Briefcase
  const blocks = parseBlocks(area.content)
  const highlightItems = blocks.bullets.length > 0 ? blocks.bullets : blocks.paragraphs.slice(0, 4)

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-8 shadow-sm sm:p-10">
          <Link
            href="/practice-areas"
            className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.24em] text-[#14203E] transition-colors hover:text-[#14203E]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {detailContent.badge || 'All Services'}
          </Link>

          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-[#F4E8D8]/10 bg-[#F6F0E8]/10 shadow-sm">
              <Icon className="h-10 w-10 text-[#14203E]" />
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-[#F4E8D8]/20 bg-[#F6F0E8]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#14203E]">
                {detailContent.badge || 'Service Overview'}
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-[#14203E] sm:text-5xl lg:text-7xl">
                {area.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                {area.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#14203E]">
                {detailContent.introLabel || 'Why this service matters'}
              </p>
              <div className="mt-4 space-y-4">
                {blocks.paragraphs.length > 0 ? blocks.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8 text-slate-600">
                    {paragraph}
                  </p>
                )) : (
                  <p className="text-base leading-8 text-slate-600">
                    {area.content || 'Detailed content for this service is managed in admin.'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {highlightItems.length > 0 ? highlightItems.map((item) => (
                <div key={item} className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#14203E]" />
                  <span className="text-sm leading-7 text-slate-700">{item}</span>
                </div>
              )) : null}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-black uppercase tracking-tight text-[#14203E]">
                {detailContent.assistanceTitle || 'Need Assistance?'}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {detailContent.assistanceBody || `Schedule a priority consultation with our legal experts specializing in ${area.title}.`}
              </p>
              <Button
                asChild
                className="mt-5 h-14 w-full rounded-2xl bg-[#14203E] font-black uppercase tracking-widest text-white hover:bg-[#F6F0E8] hover:text-[#14203E]"
              >
                <Link href="/consultation">{detailContent.consultationButton || 'Book Consultation'}</Link>
              </Button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <h4 className="text-xs font-black uppercase tracking-[0.24em] text-[#14203E]">
                {detailContent.trustTitle || 'Trust Indicators'}
              </h4>
              <div className="mt-4 flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#14203E] text-[10px] font-bold text-white">
                  +1K
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {detailContent.trustBody || 'Trusted by over 1,000+ clients in this practice area alone.'}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
