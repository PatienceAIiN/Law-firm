'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, MoreVertical, Eye, Edit2, Trash2, Download, Send } from 'lucide-react'

interface CourtCase {
  id: string
  caseNumber: string
  title: string
  caseType: string
  status: string
  court: string
  clientName: string
  clientEmail: string
  advocate?: { name: string }
  documents: Array<{ id: string; name: string }>
  payments: Array<{ id: string; amount: number }>
  nextHearingDate?: string
}

interface CaseResponse {
  cases: CourtCase[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function CaseManager() {
  const [cases, setCases] = useState<CourtCase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<CourtCase | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(searchQuery && { search: searchQuery }),
          ...(statusFilter && { status: statusFilter }),
        })

        const res = await fetch(`/api/cases?${params}`)
        const data: CaseResponse = await res.json()
        setCases(data.cases)
      } catch (error) {
        console.error('Failed to fetch cases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [page, searchQuery, statusFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case?')) return

    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCases(cases.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete case:', error)
    }
  }

  const handleSendReminder = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/send-reminder`, { method: 'POST' })
      if (res.ok) {
        alert('Reminder sent successfully')
      }
    } catch (error) {
      console.error('Failed to send reminder:', error)
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-green-100 text-green-800',
    DISPOSED: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    ADJOURNED: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Court Cases</h2>
          <p className="text-gray-600 mt-1">Manage and track all court cases</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search case number, title, or client..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="DISPOSED">Disposed</option>
            <option value="PENDING">Pending</option>
            <option value="ADJOURNED">Adjourned</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No cases found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Case Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Court</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Advocate</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{caseItem.caseNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{caseItem.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{caseItem.clientName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[caseItem.status] || 'bg-gray-100 text-gray-800'}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{caseItem.court}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{caseItem.advocate?.name || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCase(caseItem)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendReminder(caseItem.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(caseItem.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl max-h-96 overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Case Details</h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">Case Number:</h4>
                <p className="text-gray-600">{selectedCase.caseNumber}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Title:</h4>
                <p className="text-gray-600">{selectedCase.title}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Client:</h4>
                <p className="text-gray-600">{selectedCase.clientName}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Court:</h4>
                <p className="text-gray-600">{selectedCase.court}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Status:</h4>
                <p className="text-gray-600">{selectedCase.status}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Documents ({selectedCase.documents.length}):</h4>
                <ul className="text-gray-600 space-y-1">
                  {selectedCase.documents.map((doc) => (
                    <li key={doc.id} className="text-sm">• {doc.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Payments ({selectedCase.payments.length}):</h4>
                <p className="text-gray-600 text-sm">
                  Total: ₹{selectedCase.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => setSelectedCase(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleSendReminder(selectedCase.id)
                  setSelectedCase(null)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send Reminder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
