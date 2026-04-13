import { getServerSession } from 'next-auth/next'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, FileText, Users, AlertCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Advocate Dashboard | Law Firm',
}

export default async function LawyerDashboardPage() {
  const session = await getServerSession(advocateAuthOptions)

  if (!session || !session.user.id) {
    redirect('/lawyer/login')
  }

  // Fetch advocate and their assigned cases
  const advocate = await prisma.advocate.findUnique({
    where: { id: session.user.id },
    include: {
      cases: {
        include: {
          documents: { select: { id: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { nextHearingDate: 'asc' },
      },
      _count: {
        select: { cases: true, accessLogs: true },
      },
    },
  })

  if (!advocate) {
    redirect('/lawyer/login')
  }

  // Calculate statistics
  const activeCases = advocate.cases.filter((c) => c.status === 'ACTIVE').length
  const upcomingHearings = advocate.cases.filter((c) => c.nextHearingDate && new Date(c.nextHearingDate) > new Date()).length
  const totalDocuments = advocate.cases.reduce((sum, c) => sum + c.documents.length, 0)
  const totalFeePaid = advocate.cases.reduce((sum, c) => sum + c.payments.reduce((s, p) => s + p.amount, 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{advocate.name}</h1>
            <p className="text-sm text-gray-600">{advocate.title}</p>
          </div>
          <Button variant="outline" className="text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Cases', value: activeCases, icon: FileText, color: 'bg-blue-100 text-blue-600' },
            { label: 'Upcoming Hearings', value: upcomingHearings, icon: Calendar, color: 'bg-orange-100 text-orange-600' },
            { label: 'Total Documents', value: totalDocuments, icon: FileText, color: 'bg-green-100 text-green-600' },
            { label: 'Total Fees Paid', value: `₹${totalFeePaid.toLocaleString('en-IN')}`, icon: Users, color: 'bg-purple-100 text-purple-600' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Cases */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">My Cases</h2>
              <Link href="/lawyer/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {advocate.cases.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>No cases assigned yet</p>
                </div>
              ) : (
                advocate.cases.slice(0, 5).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    href={`/lawyer/cases/${caseItem.id}`}
                    className="px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{caseItem.caseNumber}</div>
                        <div className="text-sm text-gray-600">{caseItem.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Client: {caseItem.clientName}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        caseItem.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        caseItem.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {caseItem.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href="/lawyer/profile"
                className="block px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
              >
                Edit Profile
              </Link>
              <Link
                href="/lawyer/cases"
                className="block px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
              >
                View All Cases
              </Link>
              <Link
                href="/lawyer/availability"
                className="block px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
              >
                Manage Availability
              </Link>
              <Link
                href="/lawyer/access-log"
                className="block px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
              >
                Access Log
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Hearings */}
        {upcomingHearings > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Upcoming Court Hearings
              </h2>
            </div>
            <div className="divide-y">
              {advocate.cases
                .filter((c) => c.nextHearingDate && new Date(c.nextHearingDate) > new Date())
                .sort((a, b) => new Date(a.nextHearingDate!).getTime() - new Date(b.nextHearingDate!).getTime())
                .slice(0, 5)
                .map((caseItem) => (
                  <div key={caseItem.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{caseItem.caseNumber} - {caseItem.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Court: {caseItem.court}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {new Date(caseItem.nextHearingDate!).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.ceil((new Date(caseItem.nextHearingDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
