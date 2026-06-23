'use client'

import { useState } from 'react'
import {
  Send, CheckCircle, XCircle, Clock, Mail, Star, Loader2,
  ChevronDown, ChevronUp, RotateCcw, Trash2, Plus, User
} from 'lucide-react'

interface TestimonialRequest {
  id: string
  token: string
  recipientEmail: string
  recipientName: string
  status: string
  submittedName?: string | null
  submittedRole?: string | null
  submittedContent?: string | null
  submittedRating?: number | null
  createdAt: string
}

interface TestimonialRequestsManagerProps {
  initialRequests: TestimonialRequest[]
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
  deleteRequestAction: (formData: FormData) => Promise<void>
}

const STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  PENDING:   { label: 'Sent — Awaiting Response', dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-100' },
  SUBMITTED: { label: 'Response Received',         dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  APPROVED:  { label: 'Approved & Published',      dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  REJECTED:  { label: 'Rejected',                  dot: 'bg-red-400',     text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
}

function RequestCard({
  request,
  approveAction,
  rejectAction,
  deleteRequestAction,
  onResend,
}: {
  request: TestimonialRequest
  approveAction: (fd: FormData) => Promise<void>
  rejectAction: (fd: FormData) => Promise<void>
  deleteRequestAction: (fd: FormData) => Promise<void>
  onResend: (name: string, email: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(request.status === 'SUBMITTED')
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const s = STATUS[request.status] || STATUS.PENDING

  const handleApprove = async () => {
    setApproving(true)
    const fd = new FormData(); fd.set('id', request.id)
    await approveAction(fd).catch(() => {})
    setApproving(false)
  }

  const handleReject = async () => {
    setRejecting(true)
    const fd = new FormData(); fd.set('id', request.id)
    await rejectAction(fd).catch(() => {})
    setRejecting(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete request for ${request.recipientName}?`)) return
    setDeleting(true)
    const fd = new FormData(); fd.set('id', request.id)
    await deleteRequestAction(fd).catch(() => {})
    setDeleting(false)
  }

  const handleResend = async () => {
    setResending(true)
    await onResend(request.recipientName, request.recipientEmail).catch(() => {})
    setResending(false)
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  return (
    <div className="rounded-2xl border border-[#F4E8D8] bg-white overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FFFCF8] border border-[#F4E8D8] flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-[#64748b]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--primary)] text-sm truncate">{request.recipientName}</div>
          <div className="text-xs text-gray-400 truncate">{request.recipientEmail}</div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {request.status === 'SUBMITTED' && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[var(--primary)] transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide review' : 'View submitted review'}
          </button>
        </div>
      )}

      {request.status === 'SUBMITTED' && expanded && (
        <div className="mx-4 mb-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[var(--primary)] text-sm">{request.submittedName}</div>
              {request.submittedRole && <div className="text-xs text-gray-500">{request.submittedRole}</div>}
            </div>
            {request.submittedRating && (
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < (request.submittedRating || 0) ? 'text-[var(--primary)] fill-[var(--primary)]' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
            )}
          </div>
          {request.submittedContent && (
            <p className="text-sm text-gray-700 leading-relaxed italic">"{request.submittedContent}"</p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleReject}
              disabled={rejecting}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
            >
              {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Approve & Publish
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-[#F6F0E8] flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1.5">
          {(request.status === 'PENDING' || request.status === 'REJECTED') && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F4E8D8] bg-[#FFFCF8] text-[#64748b] text-xs font-medium hover:bg-[#F6F0E8] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              {resent ? 'Sent!' : 'Resend'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete
          </button>
        </div>
      </div>

      {request.status === 'APPROVED' && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <CheckCircle className="w-3 h-3" /> Live on website
          </div>
        </div>
      )}
    </div>
  )
}

export function TestimonialRequestsManager({
  initialRequests,
  approveAction,
  rejectAction,
  deleteRequestAction,
}: TestimonialRequestsManagerProps) {
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')

  const doSend = async (name: string, email: string) => {
    setSendingEmail(true)
    setSendError(null)
    setSendSuccess(false)
    try {
      const res = await fetch('/api/testimonial-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email, recipientName: name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send request')
      }
      setSendSuccess(true)
      setRecipientEmail('')
      setRecipientName('')
      setTimeout(() => setSendSuccess(false), 4000)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    await doSend(recipientName, recipientEmail)
  }

  const ordered = [
    ...initialRequests.filter(r => r.status === 'SUBMITTED'),
    ...initialRequests.filter(r => r.status === 'PENDING'),
    ...initialRequests.filter(r => r.status === 'APPROVED'),
    ...initialRequests.filter(r => r.status === 'REJECTED'),
  ]

  return (
    <div className="space-y-6">
      {/* Send Request Form */}
      <div className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#F4E8D8] flex items-center justify-center">
            <Send className="w-4 h-4 text-[#64748b]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--primary)]">Send Review Request</h3>
            <p className="text-xs text-gray-500">Client receives a personal link to submit their testimonial</p>
          </div>
        </div>

        <form onSubmit={handleSendRequest} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
              placeholder="Client name"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[var(--primary)] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#14203E]/10 transition-all"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              placeholder="client@email.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[var(--primary)] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#14203E]/10 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={sendingEmail}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {sendingEmail ? 'Sending…' : 'Send Request'}
          </button>
        </form>

        {sendSuccess && (
          <p className="mt-3 text-sm text-emerald-600 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Request sent successfully!
          </p>
        )}
        {sendError && (
          <p className="mt-3 text-sm text-red-500">{sendError}</p>
        )}
      </div>

      {ordered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ordered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              approveAction={approveAction}
              rejectAction={rejectAction}
              deleteRequestAction={deleteRequestAction}
              onResend={doSend}
            />
          ))}
        </div>
      ) : (
        <div className="py-14 rounded-2xl border border-dashed border-[#F4E8D8] bg-[#FFFCF8] flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#F4E8D8] flex items-center justify-center">
            <Send className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-400">No requests yet</p>
          <p className="text-xs text-gray-400">Use the form above to request a review from a client</p>
        </div>
      )}
    </div>
  )
}
