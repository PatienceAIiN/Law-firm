import { Mail, Phone, Linkedin } from 'lucide-react'
import Image from 'next/image'

interface TeamMember {
  id: string
  name: string
  title: string
  bio: string
  image?: string | null
  expertise?: string | null
  education?: string | null
  email?: string | null
  phone?: string | null
  linkedin?: string | null
  order: number
  isActive: boolean
}

interface TeamSectionProps {
  content?: any
  members?: TeamMember[]
}

export function TeamSection({ content, members = [] }: TeamSectionProps) {
  const section = content?.about?.team || {}

  // Fallback single member from site content
  const fallbackMember = section.member || {
    name: 'Senior Advocate',
    title: 'Founding Partner',
    expertise: 'Corporate Law, Litigation, Legal Strategy',
    bio: 'With over 20 years of experience, our founding partner has established a reputation for excellence in corporate law and complex litigation.',
    education: 'LL.B., University of Mumbai | LL.M., Harvard Law School',
    email: 'senior@lawfirm.com',
    phone: '+91 98765 43210',
    linkedin: '#',
  }

  const displayMembers: TeamMember[] = members.length > 0
    ? members
    : [{ id: 'fallback', ...fallbackMember, order: 0, isActive: true }]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0a192f]/5 border border-slate-200 text-[#0a192f] text-sm font-medium">
            <span>{section.badge || 'Our Leadership'}</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight">
            {section.heading?.split(' ').slice(0, 2).join(' ') || 'Meet Our'}{' '}
            <span className="text-gold-500">{section.heading?.split(' ').slice(2).join(' ') || 'Legal Team'}</span>
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {section.subtitle ||
              'Led by experienced legal professionals, our team combines deep expertise with a commitment to delivering exceptional results for our clients.'}
          </p>
        </div>

        {displayMembers.length === 1 ? (
          // Single-member layout
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <MemberCard member={displayMembers[0]} />
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-navy-900">{section.whyChooseTitle || 'Why Choose Our Firm?'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {section.whyChooseIntro ||
                    'Our commitment to excellence and client success sets us apart. We combine decades of experience with innovative legal strategies to deliver exceptional results.'}
                </p>
              </div>
              <div className="space-y-6">
                {(
                  section.points || [
                    { title: 'Proven Track Record', description: '98% success rate across all case types with over 1000 satisfied clients.' },
                    { title: 'Expert Legal Counsel', description: 'Specialized expertise across multiple practice areas with deep industry knowledge.' },
                    { title: 'Personalized Attention', description: 'Every client receives dedicated attention and tailored legal solutions.' },
                    { title: 'Strategic Approach', description: 'We combine legal expertise with business acumen to deliver optimal outcomes.' },
                  ]
                ).map((item: any) => (
                  <div key={item.title} className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-gold-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-navy-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Multi-member grid layout
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="card-3d rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-white p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Profile Image */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0">
          {member.image ? (
            <Image src={member.image} alt={member.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-navy-900">{member.name}</h3>
          <div className="text-gold-500 font-medium">{member.title}</div>
          <div className="text-gray-600 leading-relaxed max-w-md">{member.bio}</div>

          <div className="space-y-2">
            {member.expertise && (
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-navy-900">Expertise:</span> {member.expertise}
              </div>
            )}
            {member.education && (
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-navy-900">Education:</span> {member.education}
              </div>
            )}
          </div>
        </div>

        {/* Contact Links */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          {member.email && (
            <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 text-navy-900 hover:text-gold-500 transition-colors duration-200">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email</span>
            </a>
          )}
          {member.phone && (
            <a href={`tel:${member.phone?.replace(/[^+\d]/g, '')}`} className="flex items-center justify-center gap-2 text-navy-900 hover:text-gold-500 transition-colors duration-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm">Call</span>
            </a>
          )}
          {member.linkedin && (
            <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-navy-900 hover:text-gold-500 transition-colors duration-200">
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
