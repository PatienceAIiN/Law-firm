import { Shield, Heart, Target, Lightbulb } from 'lucide-react'

export function PhilosophySection({ content }: { content?: any }) {
  const section = content?.about?.philosophy || {}
  const values = section.values || [
    {
      icon: Shield,
      title: 'Integrity First',
      description: 'We uphold the highest ethical standards in all our dealings, ensuring transparency and trust in every client relationship.'
    },
    {
      icon: Heart,
      title: 'Client-Centered Approach',
      description: 'Your success is our priority. We provide personalized attention and tailored solutions to meet your unique legal needs.'
    },
    {
      icon: Target,
      title: 'Excellence in Execution',
      description: 'We combine deep legal expertise with strategic thinking to deliver exceptional results for our clients.'
    },
    {
      icon: Lightbulb,
      title: 'Innovative Solutions',
      description: 'We think creatively and adapt to changing legal landscapes, providing forward-thinking legal strategies.'
    }
  ]
  const fallbackIcons = [Shield, Heart, Target, Lightbulb]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#14203E]/5 border border-slate-200 text-[#14203E] text-sm font-medium">
            <span>{section.badge || 'Our Values'}</span>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight">
            {section.heading?.split(' ').slice(0, 2).join(' ') || 'Guided by'} <span className="text-gold-500">{section.heading?.split(' ').slice(2).join(' ') || 'Core Principles'}</span>
          </h2>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {section.subtitle || 'Our philosophy is built on a foundation of integrity, excellence, and unwavering commitment to our clients\' success. These values guide every decision we make.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value: any, index: number) => (
            <div 
              key={index} 
              className="text-center space-y-4 group"
            >
              <div className="w-16 h-16 bg-[#F6F0E8]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#F4E8D8]/10 group-hover:bg-[#F6F0E8]/15 transition-colors duration-300">
                {(() => {
                  const Icon = value.icon || fallbackIcons[index] || Shield
                  return <Icon className="w-8 h-8 text-gold-500" />
                })()}
              </div>
              
              <h3 className="text-xl font-semibold text-navy-900 group-hover:text-gold-500 transition-colors duration-300">
                {value.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="mt-20 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-12 relative overflow-hidden shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(10,25,47,0.08),transparent_40%)]"></div>
          </div>
          
          <div className="relative text-center space-y-6">
            <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-[#14203E]">
              {section.missionTitle || 'Our Mission'}
            </h3>
            
            <p className="text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed">
              {section.missionBody || 'To provide exceptional legal services that combine deep expertise with innovative strategies, ensuring our clients receive the best possible representation and achieve their desired outcomes. We are committed to maintaining the highest standards of integrity, professionalism, and client service in everything we do.'}
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 pt-6">
              {(section.missionPoints || [
                { title: 'Justice', subtitle: 'Upholding legal rights' },
                { title: 'Excellence', subtitle: 'Delivering superior results' },
                { title: 'Trust', subtitle: 'Building lasting relationships' }
              ]).map((item: any) => (
                <div key={item.title} className="text-center">
                  <div className="text-2xl font-black text-[#14203E]">{item.title}</div>
                  <div className="text-slate-500 text-sm">{item.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
