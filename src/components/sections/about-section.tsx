import Link from 'next/link'
import { ArrowRight, Award, Users, BookOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AboutProfile } from '@prisma/client'

interface AboutSectionProps {
  data?: AboutProfile | null
  metrics?: any[]
  content?: any
}

const ICON_MAP: Record<string, any> = {
  Award,
  Users,
  BookOpen,
  TrendingUp: Award,
  Calendar: BookOpen
}

export function AboutSection({ data, metrics, content }: AboutSectionProps) {
  const name = data?.name || 'Adv. Rajesh Kumar'
  const title = data?.title || 'Lawyer'
  const bodyContent = data?.aboutContent || 'With over two decades of dedicated legal practice, our firm has established itself as a beacon of trust and excellence.'
  const section = content?.home?.about || {}
  const highlights = section.highlights || ['Expert Legal Counsel', 'Client-Focused Approach', 'Proven Track Record']

  return (
    <section className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium">
                <span>{section.badge || 'Professional Profile'}</span>
              </div>
              
              <h2 className="text-3xl lg:text-5xl font-bold text-primary leading-tight">
                {title} <span className="text-primary">{name}</span>
              </h2>
              
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="leading-relaxed whitespace-pre-line">
                  {bodyContent}
                </p>
              </div>
            </div>

            {metrics && metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                {metrics.map((stat: any, index: number) => {
                  const Icon = ICON_MAP[stat.icon || 'Award'] || Award
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-[#F6F0E8]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{stat.label}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-primary hover:bg-[#112240] text-white px-8 py-6 rounded-xl text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Link href="/about" className="flex items-center gap-2">
                  {section.ctaPrimaryText || 'Learn More About Us'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/15 px-8 py-6 rounded-xl text-lg text-primary transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:text-white hover:shadow-lg">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right duration-700">
            <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transform rotate-2">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-white via-slate-50 to-white p-12 text-center -rotate-2">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-[#14203E] to-[#112240] shadow-2xl">
                  <span className="text-white text-3xl font-bold">
                    {name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-primary mb-2">{name}</h3>
                <p className="text-[#b8872f] font-medium text-lg mb-8">{title}</p>
                
                <div className="space-y-4 text-left">
                  {highlights.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700">
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F6F0E8]/15 rounded-full blur-[90px]"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
