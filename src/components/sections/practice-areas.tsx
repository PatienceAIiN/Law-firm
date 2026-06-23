'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Briefcase, Scale, Building, Users, FileText, Shield, Home, Gavel, Handshake, Heart, X } from 'lucide-react'
import type { PracticeArea } from '@prisma/client'

interface PracticeAreasProps {
  data: PracticeArea[]
  content?: any
}

const iconMap: Record<string, any> = {
  Briefcase,
  Scale,
  Building,
  Users,
  FileText,
  Shield,
  Home,
  Gavel,
  Handshake,
  Heart,
}

function parseBlocks(content?: string | null) {
  if (!content) return { paragraphs: [] as string[], bullets: [] as string[] }
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean)
  const bullets = lines
    .filter((line) => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
    .map((line) => line.replace(/^[-•*]\s*/, ''))
  const paragraphs = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.startsWith('-') && !part.startsWith('•') && !part.startsWith('*'))
  return { paragraphs, bullets }
}

export function PracticeAreas({ data, content }: PracticeAreasProps) {
  const section = content?.practiceAreasPage || content?.home?.practiceAreas || {}
  const [selectedArea, setSelectedArea] = useState<PracticeArea | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArea(null)
    }
    if (selectedArea) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKey)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [selectedArea])

  const modalContent = useMemo(() => parseBlocks(selectedArea?.content), [selectedArea])

  return (
    <section id="practice-areas" className="scroll-mt-28 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-[#fbfcfe] to-white p-5 shadow-sm sm:p-8">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--primary)]/5 border border-slate-200 text-[var(--primary)] text-xs font-semibold uppercase tracking-[0.24em]">
            <span>{section.badge || 'Practice Areas'}</span>
          </div>

          <h2 className="text-2xl lg:text-4xl font-black text-[var(--primary)] leading-tight uppercase tracking-tighter">
            {section.title?.split(' ')[0] || 'Browse'} <span className="text-[var(--primary)]">{section.title?.split(' ').slice(1).join(' ') || 'Legal Services'}</span>
          </h2>

          <p className="text-sm sm:text-lg text-slate-600 max-w-3xl mx-auto">
            {section.subtitle || 'Explore the legal services we offer and open the relevant detail panel for each area.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((area) => {
            const Icon = iconMap[area.icon || 'Briefcase'] || Briefcase
            return (
              <div
                key={area.id}
                className="card-3d group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-7"
              >
                <div className="absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-[#F6F0E8]/10 transition-colors group-hover:bg-[#F6F0E8]/15" />

                <div className="relative z-10 space-y-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F4E8D8]/10 bg-[#F6F0E8]/10 text-[var(--primary)] transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--primary)]">
                      {area.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {area.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#F6F0E8] hover:text-[var(--primary)]"
                  >
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedArea && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close service details"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setSelectedArea(null)}
          />

          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--primary)]">
                  {section.badge || 'Service Overview'}
                </p>
                <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-[var(--primary)] sm:text-2xl">
                  {selectedArea.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArea(null)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-[var(--primary)]"
                aria-label="Close service details dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--primary)]">
                      {section.introLabel || 'Why this service matters'}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {selectedArea.description}
                    </p>
                    {selectedArea.image && (
                      <img
                        src={selectedArea.image}
                        alt={selectedArea.title}
                        className="mt-5 h-56 w-full rounded-[22px] object-cover"
                      />
                    )}
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--primary)]">
                      {section.trustTitle || 'Trust Indicators'}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {section.trustBody || 'Trusted by over 1,000+ clients in this practice area alone.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--primary)]">
                      {section.highlightsTitle || 'Key Scope'}
                    </p>
                    <div className="mt-4 space-y-3">
                      {modalContent.bullets.length > 0 ? modalContent.bullets.map((item) => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                          {item}
                        </div>
                      )) : modalContent.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--primary)]">
                      {section.assistanceTitle || 'Need Assistance?'}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {section.assistanceBody || `Schedule a priority consultation with our legal experts specializing in ${selectedArea.title}.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArea(null)
                        window.dispatchEvent(new Event('open:consultation'))
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#F6F0E8] hover:text-[var(--primary)]"
                    >
                      {section.consultationButton || 'Book Consultation'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
