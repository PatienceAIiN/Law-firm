import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSitePages } from '@/lib/site-pages'

type CustomPageProps = {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: CustomPageProps): Promise<Metadata> {
  const { slug } = await params
  const pages = await getSitePages()
  const page = pages.find((item) => item.slug === slug.join('/'))

  if (!page) return {}

  return {
    title: page.title,
    description: page.summary || page.content,
  }
}

export default async function CustomPage({ params }: CustomPageProps) {
  const { slug } = await params
  const pages = await getSitePages()
  const page = pages.find((item) => item.slug === slug.join('/'))

  if (!page) {
    notFound()
  }

  const paragraphs = page.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {page.heroImage ? (
            <div className="relative h-72 sm:h-96">
              <img src={page.heroImage} alt={page.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[#14203E]/60" />
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
                <div className="max-w-4xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#14203E]">Custom Page</p>
                  <h1 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">{page.title}</h1>
                  <p className="mx-auto max-w-3xl text-sm leading-7 text-slate-200 sm:text-lg">{page.summary}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#14203E]">Custom Page</p>
              <h1 className="mt-4 text-3xl font-black uppercase tracking-tighter text-[#14203E] sm:text-5xl">{page.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-lg">{page.summary}</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            {paragraphs.length > 0 ? (
              <div className="space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
                {paragraphs.map((paragraph, index) => (
                  <p key={`${page.slug}-${index}`}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-500">
                Page content has not been added yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
