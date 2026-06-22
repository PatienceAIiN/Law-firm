import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Articles',
    description: 'Legal insights, analysis and updates from our advocates.',
  }
}

const FALLBACK_IMAGES = ['/figma/card-1.png', '/figma/card-2.png', '/figma/card-3.png', '/figma/card-4.png']

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

export default async function BlogListingPage() {
  const posts = await prisma.blogPost
    .findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } })
    .catch(() => [])

  return (
    <div className="-mt-3 sm:-mt-4">
      {/* Hero (cream, full-bleed) — same language as the homepage */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#FFFCF8] dark:bg-[#0b0f17]">
        <VideoCover src={COVER_VIDEOS.articles} />
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 py-24 text-center">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px]">
            Articles
          </h1>
          <p className="mt-5 max-w-[560px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70 sm:text-[22px]">
            We share our thoughts on law, strategy and the cases that shape them.
          </p>
        </div>
      </section>

      {/* Cards (white, full-bleed) */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-white dark:bg-[#0b0f17]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="mx-auto mb-14 flex max-w-[640px] items-center gap-6">
            <span className="h-px flex-1 bg-[#14203E] dark:bg-white/20" />
            <span className="whitespace-nowrap text-[14px] font-medium uppercase tracking-wide text-[#14203E] dark:text-white/80">
              Latest from our desk
            </span>
            <span className="h-px flex-1 bg-[#14203E] dark:bg-white/20" />
          </div>

          {posts.length === 0 ? (
            <p className="py-16 text-center text-[16px] text-[#14203E]/50">No articles published yet. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((p, i) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col">
                  <div className="relative aspect-[290/231] w-full overflow-hidden rounded-[6px] bg-[#F6F0E8]">
                    <Image
                      src={p.coverImage || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                      alt={p.title}
                      fill
                      sizes="(max-width:768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <h3 className="mt-5 text-[22px] font-semibold leading-snug text-[#14203E] group-hover:underline dark:text-white">
                    {p.title}
                  </h3>
                  {p.excerpt && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-[#14203E]/60 dark:text-white/55">{p.excerpt}</p>}
                  <span className="mt-3 text-[14px] text-[#14203E]/60 dark:text-white/50">
                    {formatDate(new Date(p.publishedAt || p.createdAt))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
