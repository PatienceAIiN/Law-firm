import type { AboutProfile } from '@prisma/client'

interface HeroSectionProps {
  data?: AboutProfile | null
  content?: any
}

export function HeroSection({ data, content }: HeroSectionProps) {
  const name = data?.name || 'Adv. Rajesh Kumar'
  const title = data?.title || 'Lawyer'
  const section = content?.about?.hero || {}
  
  return (
    <section className="relative bg-gradient-to-br from-[#14203E] via-[#112240] to-[#14203E] text-white overflow-hidden uppercase tracking-wider">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#F6F0E8]/20 border border-[#F4E8D8]/30 text-primary text-[10px] font-black uppercase tracking-widest">
              <span>{section.badge || 'OUR STORY & LEGACY'}</span>
            </div>
            
            <h1 className="text-4xl lg:text-7xl font-black leading-none">
              <span className="text-primary">{section.title?.split(' ')[0] || 'BEYOND'}</span>
              <br />
              <span className="text-white">{section.title?.split(' ').slice(1).join(' ') || 'LEGAL BOUNDARIES'}</span>
            </h1>
            
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-3xl mx-auto normal-case tracking-normal">
              {section.subtitle || `${title} ${name} has been at the forefront of landmark legal battles for over 25 years, defining excellence in advocacy and integrity.`}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-8">
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-primary group-hover:scale-110 transition-transform">25+</div>
              <div className="text-gray-500 text-[10px] font-bold mt-2">YEARS OF PRACTICE</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-primary group-hover:scale-110 transition-transform">1.5K+</div>
              <div className="text-gray-500 text-[10px] font-bold mt-2">SUCCESSFUL CLIENTS</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-primary group-hover:scale-110 transition-transform">98%</div>
              <div className="text-gray-500 text-[10px] font-bold mt-2">CASE VICTORY</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-primary group-hover:scale-110 transition-transform">8+</div>
              <div className="text-gray-500 text-[10px] font-bold mt-2">PRACTICE AREAS</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-12 text-[#f8fafc]" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
