import { prisma } from '@/lib/prisma'
import { CaseManager } from '@/components/admin/case-manager'
import { FileText, Scale, CalendarDays, AlertCircle } from 'lucide-react'

export default async function CasesPage() {
  const [totalCases, activeCases, upcomingHearings, urgentCases] = await Promise.all([
    prisma.courtCase.count(),
    prisma.courtCase.count({ where: { status: 'ACTIVE' } }),
    prisma.courtCase.count({ where: { nextHearingDate: { gte: new Date() } } }),
    prisma.courtCase.count({
      where: {
        nextHearingDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#14203E]">Case Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all court cases, documents, payments, and client communications.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: totalCases, icon: Scale, color: 'text-[#14203E]' },
          { label: 'Active Cases', value: activeCases, icon: FileText, color: 'text-emerald-600' },
          { label: 'Upcoming Hearings', value: upcomingHearings, icon: CalendarDays, color: 'text-blue-600' },
          { label: 'Urgent (7 days)', value: urgentCases, icon: AlertCircle, color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#F4E8D8] bg-white p-4">
            <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
            <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <CaseManager />
    </div>
  )
}
