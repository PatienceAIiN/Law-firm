import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Mail, Phone, Briefcase } from 'lucide-react'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'
import { getTenantBySlug } from '@/lib/tenant'
import { getTenantSettingJson } from '@/lib/tenant-settings'
import { BrandMark } from '@/components/layout/brand-mark'
import { prisma } from '@/lib/prisma'
import { TenantContactForm } from './contact-form'
import { BookConsultation } from './book-consultation'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

export default async function TenantSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const [practiceAreas, blogPosts, brand, team, testimonials] = await Promise.all([
    prisma.practiceArea.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' }, take: 6 }),
    prisma.blogPost.findMany({ where: { tenantId: tenant.id, status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 3 }),
    getTenantSettingJson<any>(tenant.id, 'brand_config'),
    prisma.teamMember.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' }, take: 6 }),
    prisma.testimonial.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { order: 'asc' }, take: 6 }),
  ])
  const brandData = brand || {}

  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#14203E] dark:bg-[#0b0f17] dark:text-slate-100">
      <div className="fixed right-4 top-4 z-30">
        <ThemeToggle />
      </div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <VideoCover src={COVER_VIDEOS.home} overlay="medium" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mx-auto inline-flex items-center justify-center">
            <BrandMark brand={brandData} href={`/t/${tenant.slug}`} imageHeight={56} />
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#14203E]/15 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#14203E] backdrop-blur">
            {brandData.firm_name || tenant.name}
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight">{brandData.firm_full_name || tenant.name}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700 dark:text-slate-200">
            Trusted legal counsel — building your practice on a dedicated workspace.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#book" className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d2c52]">
              Book a consultation <ArrowRight className="h-4 w-4" />
            </a>
            <Link href={`/t/${tenant.slug}/admin/login`} className="inline-flex items-center gap-2 rounded-xl border border-[#14203E]/15 bg-white/80 px-6 py-3 text-sm font-semibold text-[#14203E] backdrop-blur hover:bg-white">
              Admin login
            </Link>
          </div>
        </div>
      </section>

      {/* Practice areas */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-3xl font-bold">Practice areas</h2>
        {practiceAreas.length === 0 ? (
          <p className="text-sm text-slate-500">No practice areas published yet. Visit the admin panel to add some.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {practiceAreas.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#11151f]">
                <Briefcase className="h-6 w-6 text-[#14203E] dark:text-white" />
                <h3 className="mt-3 text-lg font-semibold text-[#14203E] dark:text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-3xl font-bold">Meet the team</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <div key={m.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
                <h3 className="text-lg font-semibold text-[#14203E] dark:text-white">{m.name}</h3>
                <p className="text-xs uppercase tracking-wide text-[#c9a227]">{m.title}</p>
                {m.bio && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{m.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-3xl font-bold">What clients say</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
                <blockquote className="text-sm italic text-slate-700 dark:text-slate-200">"{t.content}"</blockquote>
                <figcaption className="mt-3 text-xs">
                  <span className="font-semibold text-[#14203E] dark:text-white">{t.name}</span>
                  {t.role && <span className="text-slate-500"> · {t.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Articles */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-3xl font-bold">Latest articles</h2>
        {blogPosts.length === 0 ? (
          <p className="text-sm text-slate-500">No articles published yet.</p>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((b) => (
              <article key={b.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
                <h3 className="text-xl font-semibold text-[#14203E] dark:text-white">{b.title}</h3>
                {b.excerpt && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{b.excerpt}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Book consultation */}
      <section id="book" className="bg-[#11151f] py-16 text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Book a consultation</h2>
          <p className="mt-2 text-sm text-white/70">Pick a time that works for you. We'll send a confirmation by email.</p>
          <div className="mt-6">
            <BookConsultation slug={tenant.slug} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-[#0b1018] py-16 text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Or send a message</h2>
          <p className="mt-2 text-sm text-white/70">Tell us about your matter and we'll get back to you shortly.</p>
          <TenantContactForm slug={tenant.slug} />
        </div>
      </section>

      <footer className="border-t border-[#F4E8D8] py-8 text-center text-xs text-slate-500 dark:border-white/10">
        © {new Date().getFullYear()} {brandData.firm_full_name || tenant.name}. Powered by Patience AI.
      </footer>
    </div>
  )
}
