import Link from 'next/link'
import { getHomeContent } from '@/lib/home-content'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const content = await getHomeContent()

  return (
    <div className="-mt-3 sm:-mt-4">
      {/* ── Hero with animated background ───────────────────────────────────── */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#FFFCF8] transition-colors dark:bg-[#0b0f17]">
        <VideoCover src={COVER_VIDEOS.home} />
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 py-28 text-center sm:py-36">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px] lg:text-[66px]">
            {content.title}
          </h1>
          <p className="mt-6 max-w-[620px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70 sm:text-[22px]">
            {content.subtitle}
          </p>
          <Link
            href={content.ctaHref || '/consultation'}
            className="mt-10 inline-flex h-[73px] items-center justify-center rounded-[10px] bg-[#14203E] px-10 text-[18px] font-medium text-white transition-colors hover:bg-[#1d2c52] dark:bg-white dark:text-[#14203E] dark:hover:bg-white/90"
          >
            {content.ctaLabel || 'Get started'}
          </Link>
        </div>
      </section>

      {/* ── Dynamic feature cards (admin-editable) ──────────────────────────── */}
      {content.features.length > 0 && (
        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-white transition-colors dark:bg-[#0b0f17]">
          <div className="mx-auto max-w-[1280px] px-6 py-20">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.features.map((f, i) => (
                <div key={i} className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-7 transition-colors dark:border-white/10 dark:bg-[#11151f]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#14203E] text-[18px] font-bold text-white dark:bg-white dark:text-[#14203E]">
                    {i + 1}
                  </div>
                  <h3 className="text-[20px] font-semibold text-[#14203E] dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#14203E]/65 dark:text-white/60">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
