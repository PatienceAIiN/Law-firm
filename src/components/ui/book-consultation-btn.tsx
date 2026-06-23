'use client'

import { Calendar } from 'lucide-react'

interface BookConsultationBtnProps {
  label?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'gold'
}

export function BookConsultationBtn({
  label = 'Book Consultation',
  className = '',
  variant = 'primary',
}: BookConsultationBtnProps) {
  const handleClick = () => {
    window.dispatchEvent(new Event('open:consultation'))
  }

  const base =
    'inline-flex items-center gap-2 font-black uppercase tracking-widest text-xs px-6 py-4 rounded-2xl transition-all cursor-pointer'

  const variants = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[#F6F0E8] shadow-lg shadow-[#14203E]/20',
    secondary: 'bg-white text-[var(--primary)] border border-gray-200 hover:bg-[var(--primary)] hover:text-white',
    gold: 'bg-[#F6F0E8] text-[var(--primary)] hover:bg-[#d4b06a] shadow-lg shadow-[#14203E]/20',
  }

  return (
    <button type="button" onClick={handleClick} className={`${base} ${variants[variant]} ${className}`}>
      <Calendar className="w-4 h-4" />
      {label}
    </button>
  )
}
