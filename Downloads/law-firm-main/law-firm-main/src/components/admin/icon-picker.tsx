'use client'

import * as Icons from 'lucide-react'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { AdminDialog } from './admin-dialog'
import { cn } from '@/lib/utils'

// A curated list of relevant icons for a law firm
const COMMON_ICONS = [
  'Scale', 'Gavel', 'Book', 'Briefcase', 'Shield', 'FileText', 'Users', 'Building', 
  'Globe', 'Award', 'Star', 'TrendingUp', 'Target', 'Coffee', 'Heart', 'Flag',
  'PenTool', 'Search', 'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'Bell'
]

interface IconPickerProps {
  value: string
  onChange: (name: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const Icon = (Icons as any)[value] || Icons.HelpCircle

  const filteredIcons = COMMON_ICONS.filter(name => 
    name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-navy-900/10 w-full"
      >
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 text-navy-900">
           <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
           <div className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">Selected Icon</div>
           <div className="text-xs font-bold text-navy-900">{value || 'None'}</div>
        </div>
      </button>

      <AdminDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Icon"
        description="Choose a visual representative for this item"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-navy-900/10 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto p-1">
            {filteredIcons.map((name) => {
              const CurrentIcon = (Icons as any)[name]
              return (
                <button
                  key={name}
                  onClick={() => {
                    onChange(name)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-105",
                    value === name 
                      ? "bg-navy-900 border-navy-900 text-white shadow-xl shadow-navy-900/20" 
                      : "bg-white border-gray-100 text-gray-400 hover:text-navy-900 hover:border-navy-900/20"
                  )}
                >
                  <CurrentIcon className="w-6 h-6" />
                  <span className="text-[8px] font-bold uppercase mt-2 hidden sm:block">{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </AdminDialog>
    </div>
  )
}
