'use client'

import { useState } from 'react'
import { ShieldAlert, Filter, Trash2, Loader2 } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  MEETING_JOINED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEETING_ENDED: 'bg-gray-50 text-gray-600 border-gray-200',
  TAB_SWITCH: 'bg-amber-50 text-amber-700 border-amber-200',
  WINDOW_BLUR: 'bg-orange-50 text-orange-700 border-orange-200',
  RECORDING_STARTED: 'bg-blue-50 text-blue-700 border-blue-200',
  RECORDING_SAVED: 'bg-blue-50 text-blue-700 border-blue-200',
  TAMPER_ATTEMPT: 'bg-red-50 text-red-700 border-red-200',
}

interface ActivityLogPanelProps {
  events: any[]
  bookings: { id: string; name: string }[]
}

export function ActivityLogPanel({ events, bookings }: ActivityLogPanelProps) {
  const [filter, setFilter] = useState<string>('all')
  const [clearing, setClearing] = useState(false)

  const bookingMap = Object.fromEntries(bookings.map(b => [b.id, b.name]))

  const filtered = filter === 'all' ? events : events.filter(e => e.bookingId === filter)
  const suspiciousTypes = ['TAB_SWITCH', 'WINDOW_BLUR', 'TAMPER_ATTEMPT']
  const suspicious = events.filter(e => suspiciousTypes.includes(e.type))

  const handleClear = async () => {
    if (!confirm('Clear all activity logs?')) return
    setClearing(true)
    try {
      await fetch('/api/admin/meeting-activity', { method: 'DELETE' })
      window.location.reload()
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-4">
      {suspicious.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            {suspicious.length} suspicious event(s) detected (tab switches, window blur).
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-[#e8e3dc] bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0ece4] bg-[#faf8f5]">
          <Filter className="w-4 h-4 text-[#8c7355]" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-[#1a1208] outline-none"
          >
            <option value="all">All Meetings ({events.length} events)</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({events.filter(e => e.bookingId === b.id).length})</option>
            ))}
          </select>
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Clear All
          </button>
        </div>
        <div className="divide-y divide-[#f0ece4] max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No activity events.</div>
          )}
          {filtered.map((e: any) => (
            <div key={e.id} className="px-4 py-3 flex items-start gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${TYPE_COLORS[e.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {e.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#1a1208]">{e.details}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {bookingMap[e.bookingId] || e.bookingId.slice(0, 8)} · {new Date(e.timestamp).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
