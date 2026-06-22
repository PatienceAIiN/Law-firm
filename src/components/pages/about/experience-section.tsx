import { Award, Scale, Users, FileText } from 'lucide-react'
import type { AboutProfile } from '@prisma/client'

interface ExperienceSectionProps {
  data?: AboutProfile | null
  content?: any
}

export function ExperienceSection({ data, content }: ExperienceSectionProps) {
  const section = content?.about?.experience || {}
  const achievements = section.achievements || [
    {
      icon: Award,
      title: '25+ Years of Excellence',
      description: 'Founded on principles of integrity, we have built a multi-decade legacy of success.',
      stat: '25+'
    },
    {
      icon: Users,
      title: '1500+ Clients',
      description: 'Serving diverse clients from individuals to major corporations with personalized care.',
      stat: '1500+'
    },
    {
      icon: Scale,
      title: '98% Victory Rate',
      description: 'Our track record in state and high courts speaks for our rigorous legal strategy.',
      stat: '98%'
    },
    {
      icon: FileText,
      title: 'High Court Practice',
      description: 'Extensive experience in litigation, constitutional law, and corporate resolution.',
      stat: 'Elite'
    }
  ]
  const fallbackIcons = [Award, Users, Scale, FileText]

  return (
    <section className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-black text-[#14203E] uppercase tracking-tighter">
                {section.heading?.split(' ').slice(0, 3).join(' ') || 'The Heritage of'} <span className="text-[#14203E]">{section.heading?.split(' ').slice(3).join(' ') || 'Advocacy'}</span>
              </h2>
              <div className="w-20 h-1.5 bg-[#F6F0E8] rounded-full"></div>
            </div>
            <div className="prose prose-lg text-gray-500 font-medium leading-relaxed">
              <p className="whitespace-pre-line">
                {section.intro || data?.aboutContent || 'Our firm is dedicated to providing personalized legal solutions with integrity and excellence.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right duration-700">
            {achievements.map((achievement: any, index: number) => (
              <div 
                key={index} 
                className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="w-12 h-12 bg-[#F6F0E8]/10 rounded-2xl flex items-center justify-center mb-6">
                  {(() => {
                    const Icon = achievement.icon || fallbackIcons[index] || Award
                    return <Icon className="w-6 h-6 text-[#14203E]" />
                  })()}
                </div>
                <div className="text-3xl font-black text-[#14203E] mb-1 tracking-tighter">{achievement.stat}</div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {achievement.title}
                </h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Journey/Milestones can be static or hardcoded for now as per design */}
        <div className="relative overflow-hidden rounded-[3rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-12 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="absolute top-0 right-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-[#F6F0E8]/10 blur-3xl"></div>
          <div className="relative z-10 grid grid-cols-1 gap-12 text-center md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-[#14203E] text-5xl font-black">{section.milestones?.[0]?.year || '2003'}</div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{section.milestones?.[0]?.label || 'Foundation Rooted in Ethics'}</p>
            </div>
            <div className="space-y-2">
              <div className="text-[#14203E] text-5xl font-black">{section.milestones?.[1]?.year || '2015'}</div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{section.milestones?.[1]?.label || 'Expansion to High Court Chambers'}</p>
            </div>
            <div className="space-y-2">
              <div className="text-[#14203E] text-5xl font-black">{section.milestones?.[2]?.year || '2024'}</div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{section.milestones?.[2]?.label || 'Digital Legal Transformation'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
