import { getServerSession } from 'next-auth/next'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, DollarSign, MessageSquare, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Case Details | Advocate Portal',
}

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params
  const session = await getServerSession(advocateAuthOptions)

  if (!session || !session.user.id) {
    redirect('/lawyer/login')
  }

  // Fetch case and verify advocate authorization
  const courtCase = await prisma.courtCase.findUnique({
    where: { id: caseId },
    include: {
      advocate: true,
      documents: { orderBy: { uploadedAt: 'desc' } },
      payments: { orderBy: { paymentDate: 'desc' } },
      notes: {
        include: {
          advocate: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!courtCase) {
    redirect('/lawyer/cases')
  }

  // Check authorization - only assigned advocate can view
  if (courtCase.advocateId !== session.user.id) {
    redirect('/lawyer/cases')
  }

  const documents = courtCase.documents ?? []
  const payments = courtCase.payments ?? []
  const notes = courtCase.notes ?? []
  const totalFeePaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/lawyer/cases" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{courtCase.caseNumber}</h1>
          <p className="text-gray-600 mt-1">{courtCase.title}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Case Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600">Case Type</div>
              <div className="font-semibold text-gray-900">{courtCase.caseType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className={`font-semibold ${courtCase.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-900'}`}>
                {courtCase.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Court</div>
              <div className="font-semibold text-gray-900">{courtCase.court}</div>
            </div>
            {courtCase.judge && (
              <div>
                <div className="text-sm text-gray-600">Judge</div>
                <div className="font-semibold text-gray-900">{courtCase.judge}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Filing Date</div>
              <div className="font-semibold text-gray-900">
                {courtCase.filingDate ? new Date(courtCase.filingDate).toLocaleDateString('en-IN') : 'N/A'}
              </div>
            </div>
            {courtCase.nextHearingDate && (
              <div>
                <div className="text-sm text-gray-600">Next Hearing</div>
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  {new Date(courtCase.nextHearingDate).toLocaleDateString('en-IN')}
                </div>
              </div>
            )}
          </div>

          {courtCase.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Case Summary</h3>
              <p className="text-gray-600 whitespace-pre-line">{courtCase.description}</p>
            </div>
          )}
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="font-semibold text-gray-900">{courtCase.clientName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="text-gray-900">{courtCase.clientEmail}</div>
            </div>
            {courtCase.clientPhone && (
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="text-gray-900">{courtCase.clientPhone}</div>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents ({documents.length})
            </h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-semibold text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payments ({payments.length})
            </h2>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</div>
                    <div className="text-sm text-gray-600">{payment.mode} • {new Date(payment.paymentDate).toLocaleDateString('en-IN')}</div>
                    {payment.reference && <div className="text-xs text-gray-500">Ref: {payment.reference}</div>}
                  </div>
                  {payment.receiptSent && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Receipt Sent</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Fees Paid</span>
                <span className="text-xl font-bold text-green-600">₹{totalFeePaid.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Case Notes */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Case Notes ({notes.length})
            </h2>
          {notes.length === 0 ? (
            <p className="text-gray-500">No notes yet</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className={`p-4 rounded-lg ${note.isPrivate ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{note.advocate.name}</div>
                      <div className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                    {note.isPrivate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Private</span>
                    )}
                  </div>
                  <p className="text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
