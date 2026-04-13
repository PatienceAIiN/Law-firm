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
    primary: 'bg-[#0a192f] text-white hover:bg-[#c5a059] shadow-lg shadow-[#0a192f]/20',
    secondary: 'bg-white text-[#0a192f] border border-gray-200 hover:bg-[#0a192f] hover:text-white',
    gold: 'bg-[#c5a059] text-[#0a192f] hover:bg-[#d4b06a] shadow-lg shadow-[#c5a059]/20',
  }

  return (
    <button type="button" onClick={handleClick} className={`${base} ${variants[variant]} ${className}`}>
      <Calendar className="w-4 h-4" />
      {label}
    </button>
  )
}
