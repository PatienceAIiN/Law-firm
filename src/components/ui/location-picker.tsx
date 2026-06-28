'use client'

import { useEffect, useRef, useState } from 'react'
import { INDIA_STATES, citiesFor } from '@/lib/india-locations'
import { fetchLocalities, type Locality } from '@/lib/india-localities'

export type Location = { state: string; city: string; locality?: string; pincode?: string }

// Cascading state → city → locality picker. State + city are required;
// locality is an autocomplete fed by India Post's PostalPinCode API
// (open source) and saves the typed value even when nothing matches.
export function LocationPicker({
  value,
  onChange,
  required = false,
  layout = 'grid',
}: {
  value?: Partial<Location>
  onChange: (next: Location) => void
  required?: boolean
  layout?: 'grid' | 'stack'
}) {
  const [state, setState] = useState(value?.state || '')
  const [city, setCity] = useState(value?.city || '')
  const [locality, setLocality] = useState(value?.locality || '')
  const [pincode, setPincode] = useState(value?.pincode || '')
  const [suggestions, setSuggestions] = useState<Locality[]>([])
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<number | null>(null)

  // Cities reset when state changes.
  useEffect(() => {
    if (state && !citiesFor(state).includes(city)) setCity('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Locality autocomplete debounced 300 ms.
  useEffect(() => {
    if (!locality || locality.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const list = await fetchLocalities(locality)
      // Prefer matches inside the chosen city/state when known.
      const filtered = state && city
        ? list.filter((l) => (l.state || '').toLowerCase() === state.toLowerCase() || (l.district || '').toLowerCase().includes(city.toLowerCase()))
        : list
      setSuggestions((filtered.length ? filtered : list).slice(0, 8))
    }, 300)
  }, [locality, state, city])

  useEffect(() => {
    onChange({ state, city, locality: locality || undefined, pincode: pincode || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, city, locality, pincode])

  const cities = state ? citiesFor(state) : []
  const cls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/15 dark:bg-[#1a2030] dark:text-white'

  return (
    <div className={layout === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
      <label className="block text-sm">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">State{required ? ' *' : ''}</span>
        <select required={required} value={state} onChange={(e) => setState(e.target.value)} className={cls}>
          <option value="">Select state…</option>
          {INDIA_STATES.map((s) => <option key={s} value={s} className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white">{s}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">City{required ? ' *' : ''}</span>
        <select required={required} value={city} onChange={(e) => setCity(e.target.value)} disabled={!state} className={cls}>
          <option value="">{state ? 'Select city…' : 'Pick state first'}</option>
          {cities.map((c) => <option key={c} value={c} className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white">{c}</option>)}
        </select>
      </label>
      <label className={`relative block text-sm ${layout === 'grid' ? 'sm:col-span-2' : ''}`}>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Locality / suburb (optional)</span>
        <input
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="e.g. Bandra, Koramangala, Saket"
          className={cls}
          autoComplete="off"
        />
        {focused && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/15 dark:bg-[#1a2030]">
            {suggestions.map((s) => (
              <li key={`${s.name}-${s.pincode}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setLocality(s.name)
                    setPincode(s.pincode)
                    if (s.state && !state) setState(s.state)
                    setSuggestions([])
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <span className="truncate text-slate-800 dark:text-slate-100">{s.name}</span>
                  <span className="flex-shrink-0 font-mono text-[10px] text-slate-500">{s.pincode}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>
      {pincode && (
        <p className={`text-[11px] text-slate-500 dark:text-slate-400 ${layout === 'grid' ? 'sm:col-span-2' : ''}`}>PIN <code className="font-mono">{pincode}</code> set from selection.</p>
      )}
    </div>
  )
}
