import { getServerSession } from 'next-auth/next'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'My Cases | Advocate Portal',
}

export default async function LawyerCasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; search?: string }>
}) {
  const session = await getServerSession(advocateAuthOptions)

  if (!session || !session.user.id) {
    redirect('/lawyer/login')
  }

  const sp = searchParams ? await searchParams : {}
  const statusFilter = sp.status || ''
  const searchQuery = sp.search || ''

  // Fetch advocate's cases
  const cases = await prisma.courtCase.findMany({
    where: {
      advocateId: session.user.id,
      AND: [
        searchQuery ? {
          OR: [
            { caseNumber: { contains: searchQuery, mode: 'insensitive' } },
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { court: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {},
        statusFilter ? { status: statusFilter } : {},
      ]
    },
    include: {
      documents: { select: { id: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { nextHearingDate: 'asc' },
  })
  const safeCases = cases.map((item) => ({
    ...item,
    documents: item.documents ?? [],
    payments: item.payments ?? [],
  }))

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    DISPOSED: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    ADJOURNED: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
              <p className="text-gray-600 mt-1">Cases assigned to you</p>
            </div>
            <Link href="/lawyer/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search by case number, title or court..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="status"
              defaultValue={statusFilter}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="DISPOSED">Disposed</option>
              <option value="PENDING">Pending</option>
              <option value="ADJOURNED">Adjourned</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Cases List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {safeCases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No cases found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeCases.map((caseItem) => {
              const totalPaid = caseItem.payments.reduce((sum, p) => sum + p.amount, 0)
              const isUrgent = caseItem.nextHearingDate && new Date(caseItem.nextHearingDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

              return (
                <Link
                  key={caseItem.id}
                  href={`/lawyer/cases/${caseItem.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-600">{caseItem.caseNumber}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[caseItem.status] || 'bg-gray-100 text-gray-800'}`}>
                          {caseItem.status}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{caseItem.title}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-1">Case Type</div>
                      <div className="text-gray-900">{caseItem.caseType}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-1">Court</div>
                      <div className="text-gray-900">{caseItem.court}</div>
                    </div>
                    {caseItem.nextHearingDate && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Next Hearing
                        </div>
                        <div className="text-gray-900">{new Date(caseItem.nextHearingDate).toLocaleDateString('en-IN')}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-1">Details</div>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FileText className="w-3 h-3" /> {caseItem.documents.length} docs
                        {totalPaid > 0 && (
                          <>
                            <span className="text-gray-300">•</span>
                            <DollarSign className="w-3 h-3" /> ₹{totalPaid.toLocaleString('en-IN')}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
