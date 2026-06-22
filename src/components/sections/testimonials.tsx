'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'

interface TestimonialsProps {
  data: any[]
  metrics: any[]
  content?: any
}

const FALLBACK_TESTIMONIALS = [
  {
    id: 'fallback-1',
    rating: 5,
    content: 'Prompt, precise, and practical advice from the first consultation onward.',
    name: 'Client Feedback',
    role: 'Corporate Matter',
  },
  {
    id: 'fallback-2',
    rating: 5,
    content: 'Clear communication and steady guidance through a complex legal process.',
    name: 'Client Feedback',
    role: 'Litigation Matter',
  },
  {
    id: 'fallback-3',
    rating: 5,
    content: 'Responsive support with a strong understanding of strategy and outcomes.',
    name: 'Client Feedback',
    role: 'Advisory Matter',
  },
  {
    id: 'fallback-4',
    rating: 5,
    content: 'The team stayed organized, calm, and responsive at every stage of the matter.',
    name: 'Client Feedback',
    role: 'Commercial Dispute',
  },
  {
    id: 'fallback-5',
    rating: 5,
    content: 'A disciplined, client-first approach that made the entire process easier to handle.',
    name: 'Client Feedback',
    role: 'Family Matter',
  },
  {
    id: 'fallback-6',
    rating: 5,
    content: 'Sharp legal judgment and excellent follow-through from start to finish.',
    name: 'Client Feedback',
    role: 'Property Matter',
  },
]

export function Testimonials({ data: testimonials, metrics, content }: TestimonialsProps) {
  const section = content?.home?.testimonials || {}
  const items = testimonials && testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollState = () => {
    const el = carouselRef.current
    if (!el) return

    const epsilon = 2
    setCanScrollPrev(el.scrollLeft > epsilon)
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - epsilon)
  }

  const scrollCarousel = (direction: -1 | 1) => {
    const el = carouselRef.current
    if (!el) return

    el.scrollBy({
      left: direction * Math.max(el.clientWidth * 0.9, 320),
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    updateScrollState()
    const el = carouselRef.current
    if (!el) return

    const onScroll = () => updateScrollState()
    const onResize = () => updateScrollState()

    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [items.length])

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#14203E]/5 border border-slate-200 text-[#14203E] text-sm font-medium">
            <span>{section.badge || 'Client Success Stories'}</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight">
            {section.title?.split(' ')[0] || 'What'} <span className="text-gold-500">{section.title?.split(' ').slice(1).join(' ') || 'Our Clients Say'}</span>
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {section.subtitle || "Don't just take our word for it. Hear from some of our satisfied clients who have experienced our commitment to legal excellence firsthand."}
          </p>
        </div>

        <div className="relative">
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={updateScrollState}
          >
            {items.map((testimonial) => (
              <article
                key={testimonial.id}
                className="card-3d min-w-full snap-start rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 sm:min-w-[calc(50%-0.75rem)] lg:min-w-[calc(33.333%-1rem)]"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold-500 fill-current" />
                  ))}
                </div>

                <div className="relative mb-6">
                  <Quote className="w-8 h-8 text-gold-500/20 absolute -top-2 -left-2" />
                  <p className="text-gray-700 leading-relaxed relative z-10">
                    {testimonial.content}
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                    <span className="text-navy-900 font-semibold text-sm">
                      {(testimonial.name || 'Client').split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {items.length > 3 && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                disabled={!canScrollPrev}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-[#14203E] hover:text-[#14203E] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                disabled={!canScrollNext}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-[#14203E] hover:text-[#14203E] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next testimonials"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {metrics && metrics.length > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-gray-600">
              {metrics.map((m) => (
                <div key={m.id} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                  <span className="font-bold">{m.value} {m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
