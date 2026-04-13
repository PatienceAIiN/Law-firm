'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

export default function TestimonialRequestPage() {
  const { token } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recipientName, setRecipientName] = useState('')

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)

  useEffect(() => {
    if (!token) return
    fetch(`/api/testimonial-request?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Invalid or expired link')
        }
        return res.json()
      })
      .then((data) => {
        setRecipientName(data.recipientName)
        setName(data.recipientName)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/testimonial-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, role, content, rating }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#c5a059]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="max-w-md w-full card-3d bg-white rounded-[2rem] border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-[#0a192f] mb-2">Link Unavailable</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="max-w-md w-full card-3d bg-white rounded-[2rem] border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-[#0a192f] mb-3">Thank You!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your testimonial has been submitted successfully. Once our team reviews and approves it, it will appear on our website.
          </p>
          <p className="mt-4 text-xs text-gray-400">We genuinely appreciate you taking the time to share your experience.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0a192f]/5 border border-slate-200 text-[#0a192f] text-sm font-medium mb-4">
            Share Your Experience
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#0a192f]">
            Your <span className="text-[#c5a059]">Testimonial</span>
          </h1>
          {recipientName && (
            <p className="mt-3 text-gray-600">
              Hi <span className="font-semibold text-[#0a192f]">{recipientName}</span>, we'd love to hear about your experience with us.
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-3d bg-white rounded-[2rem] border border-slate-200 p-8 space-y-5">
          {/* Rating */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
              Your Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'text-[#c5a059] fill-[#c5a059]' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Your Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-navy-900 outline-none focus:ring-2 focus:ring-navy-900/10 transition-all"
              placeholder="Full name"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Role / Context <span className="text-slate-400 normal-case font-medium">(optional)</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-navy-900 outline-none focus:ring-2 focus:ring-navy-900/10 transition-all"
              placeholder="e.g. Property Dispute, Family Matter"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Your Experience *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-navy-900 outline-none focus:ring-2 focus:ring-navy-900/10 transition-all resize-none"
              placeholder="Share what you experienced working with our team..."
            />
            <p className="mt-1.5 text-xs text-gray-400">{content.length}/500 characters</p>
          </div>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-full py-4 bg-[#0a192f] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#c5a059] hover:text-[#0a192f] transition-all shadow-xl shadow-navy-900/20 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </span>
            ) : (
              'Submit Testimonial'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your testimonial will be reviewed before it appears on our website.
        </p>
      </div>
    </div>
  )
}
