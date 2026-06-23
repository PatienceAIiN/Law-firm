import Link from 'next/link'
import { Calendar, FileText, Mail, Briefcase, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export async function DashboardOverview() {
  const [blogCount, bookingCount, inquiryCount, practiceCount] = await Promise.all([
    prisma.blogPost.count(),
    prisma.consultationBooking.count(),
    prisma.contactSubmission.count(),
    prisma.practiceArea.count()
  ])

  const stats = [
    {
      title: 'Booking Requests',
      value: bookingCount.toString(),
      icon: Calendar,
      href: '/admin/availability'
    },
    {
      title: 'Inbox Leads',
      value: inquiryCount.toString(),
      icon: Mail,
      href: '/admin/inbox'
    },
    {
      title: 'Articles',
      value: blogCount.toString(),
      icon: FileText,
      href: '/admin/blogs'
    },
    {
      title: 'Practice Areas',
      value: practiceCount.toString(),
      icon: Briefcase,
      href: '/admin/practice-areas'
    }
  ]

  return (
    <div className="bg-white rounded-[2.5rem] card-3d border border-gray-100 p-10">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-xl font-black text-[var(--primary)] uppercase tracking-tighter">Activity Overview</h2>
        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5 mr-1 text-[var(--primary)]" />
          Synchronized Live
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href} className="group">
            <div className="p-6 bg-[#f8fafc] border border-gray-100 rounded-3xl hover:bg-[var(--primary)] hover:shadow-xl transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-[#F6F0E8]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#F6F0E8] transition-colors">
                  <stat.icon className="w-6 h-6 text-[var(--primary)] group-hover:text-[var(--primary)] transition-colors" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-4xl font-black text-[var(--primary)] group-hover:text-white transition-colors tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-bold text-gray-400 group-hover:text-gray-400 uppercase tracking-widest">{stat.title}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
