'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { ConsultationForm } from '@/components/pages/consultation/consultation-form'

interface ConsultationModalProps {
  open: boolean
  onClose: () => void
  content?: any
}

export function ConsultationModal({ open, onClose, content }: ConsultationModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-3 sm:p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px]" />

      {/* Center dialog */}
      <div className="relative z-10 flex w-full max-w-[1180px] max-h-[92vh] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-black/25">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Booking Modal</p>
            <h2 className="text-lg font-black uppercase tracking-tight text-primary">Book Consultation</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-primary"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConsultationForm content={content} inModal onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
