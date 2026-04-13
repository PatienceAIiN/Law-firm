import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Scale, Plus, Search, FileText, IndianRupee, Calendar, AlertCircle } from 'lucide-react'

function statusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-50 text-gray-600 border-gray-200',
    DISPOSED: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ADJOURNED: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return map[status] || 'bg-gray-50 text-gray-600 border-gray-200'
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; caseType?: string }>
}) {
  const sp = searchParams ? await searchParams : {}
  const search = sp.search || ''
  const statusFilter = sp.status || ''
  const typeFilter = sp.caseType || ''

  const cases = await prisma.courtCase.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { caseNumber: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
            { clientName: { contains: search, mode: 'insensitive' } },
            { court: { contains: search, mode: 'insensitive' } },
          ]
        } : {},
        statusFilter ? { status: statusFilter } : {},
        typeFilter ? { caseType: typeFilter } : {},
      ]
    },
    include: {
      documents: { select: { id: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalCases = await prisma.courtCase.count()
  const activeCases = await prisma.courtCase.count({ where: { status: 'ACTIVE' } })
  const upcomingHearings = await prisma.courtCase.count({
    where: { nextHearingDate: { gte: new Date() } },
  })

  // Cases with hearing in next 7 days
  const urgentDate = new Date()
  urgentDate.setDate(urgentDate.getDate() + 7)
  const urgentCases = await prisma.courtCase.count({
    where: { nextHearingDate: { gte: new Date(), lte: urgentDate } },
  })

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#1a1208]">Case Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all court cases, documents, payments and client communications.</p>
        </div>
        <Link
          href="/admin/cases/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1208] text-white text-sm font-bold hover:bg-[#2d1f0d] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Case
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: totalCases, icon: Scale, color: 'text-[#1a1208]' },
          { label: 'Active Cases', value: activeCases, icon: FileText, color: 'text-emerald-600' },
          { label: 'Upcoming Hearings', value: upcomingHearings, icon: Calendar, color: 'text-blue-600' },
          { label: 'Urgent (7 days)', value: urgentCases, icon: AlertCircle, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#e8e3dc] bg-white p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by case number, title, client or court…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e8e3dc] text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#1a1208]/10 bg-white"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="px-4 py-2.5 rounded-xl border border-[#e8e3dc] text-sm text-[#1a1208] outline-none bg-white"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="caseType"
          defaultValue={typeFilter}
          className="px-4 py-2.5 rounded-xl border border-[#e8e3dc] text-sm text-[#1a1208] outline-none bg-white"
        >
          <option value="">All Types</option>
          {['Civil', 'Criminal', 'Family', 'Property', 'Labour', 'Constitutional', 'Commercial', 'Revenue', 'Consumer', 'Motor Accident'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#1a1208] text-white text-sm font-bold hover:bg-[#2d1f0d] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Case List */}
      <div className="space-y-3">
        {cases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#e8e3dc] p-12 text-center">
            <Scale className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No cases found. <Link href="/admin/cases/new" className="text-[#8c7355] font-semibold hover:underline">Add your first case.</Link></p>
          </div>
        )}
        {cases.map((c) => {
          const totalPaid = c.payments.reduce((sum, p) => sum + p.amount, 0)
          const hearingDate = c.nextHearingDate
            ? new Date(c.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
            : null
          const isUrgent = c.nextHearingDate && new Date(c.nextHearingDate) <= urgentDate && new Date(c.nextHearingDate) >= new Date()

          return (
            <Link
              key={c.id}
              href={`/admin/cases/${c.id}`}
              className="block rounded-2xl border border-[#e8e3dc] bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black font-mono text-[#8c7355]">{c.caseNumber}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600">
                      {c.caseType}
                    </span>
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200 bg-red-50 text-red-600">
                        <AlertCircle className="w-2.5 h-2.5" /> Hearing Soon
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#1a1208]">{c.title}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Client: <strong>{c.clientName}</strong></span>
                    <span>Court: {c.court}</span>
                    {c.advocateId && <span>Advocate ID: {c.advocateId}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 lg:flex-col lg:text-right">
                  {hearingDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#d4a853]" />
                      <span className="font-semibold text-[#1a1208]">{hearingDate}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#8c7355]" />{c.documents.length} docs
                  </span>
                  {totalPaid > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-emerald-600" />
                      {totalPaid.toLocaleString('en-IN')} paid
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
