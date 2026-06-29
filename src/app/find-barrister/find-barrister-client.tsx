'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { Building2, User, MapPin, Search, X, Send, Loader2, Crosshair, CheckCircle2, Sparkles, MessageSquare, Camera, ChevronLeft, ChevronRight, Scale, Video, Calendar, LogIn } from 'lucide-react'
import { INDIA_STATES, citiesFor, nearestCity } from '@/lib/india-locations'
import { sendDirectoryMessage } from './actions'

type Firm = { id: string; slug: string; name: string; state: string | null; city: string | null; locality: string | null }
type Lawyer = {
  id: string; name: string; title: string; profileImage: string | null
  expertise: string | null; bio: string | null
  state: string | null; city: string | null; locality: string | null
  firmSlug: string | null; firmName: string | null
}

export function FindBarristerClient({
  initialTab, initialState, initialCity, initialQ, firms, lawyers,
}: {
  initialTab: 'firms' | 'lawyers'; initialState: string; initialCity: string; initialQ: string
  firms: Firm[]; lawyers: Lawyer[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'firms' | 'lawyers'>(initialTab)
  const [state, setState] = useState(initialState)
  const [city, setCity] = useState(initialCity)
  const [q, setQ] = useState(initialQ)
  const [target, setTarget] = useState<{ kind: 'firm' | 'lawyer'; data: Firm | Lawyer } | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoErr, setGeoErr] = useState('')

  const cities = useMemo(() => (state ? citiesFor(state) : []), [state])

  // One-time intro popup for this feature.
  const [intro, setIntro] = useState(false)
  useEffect(() => {
    try {
      const seen = localStorage.getItem('intro:find-barrister:v1')
      if (!seen) setIntro(true)
    } catch {}
  }, [])
  const closeIntro = () => {
    try { localStorage.setItem('intro:find-barrister:v1', new Date().toISOString()) } catch {}
    setIntro(false)
  }

  const apply = () => {
    const params = new URLSearchParams()
    if (state) params.set('state', state)
    if (city) params.set('city', city)
    if (q) params.set('q', q)
    if (tab) params.set('tab', tab)
    router.push(`/find-barrister?${params.toString()}`)
  }

  // Auto-apply filters as soon as state / city change so clearing them
  // refreshes the list immediately — no manual "Search" click required.
  // The search-text box stays debounced via a Search button to avoid
  // querying on every keypress.
  const firstRunRef = useRef(true)
  useEffect(() => {
    if (firstRunRef.current) { firstRunRef.current = false; return }
    apply()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, city])

  const detectLocation = () => {
    setGeoErr(''); setGeoBusy(true)
    if (!navigator.geolocation) {
      setGeoBusy(false); setGeoErr('Geolocation not supported on this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition((p) => {
      const near = nearestCity(p.coords.latitude, p.coords.longitude)
      if (near) {
        setState(near.state); setCity(near.city)
        const params = new URLSearchParams({ state: near.state, city: near.city, tab })
        router.push(`/find-barrister?${params.toString()}`)
      } else {
        setGeoErr('Could not match your location. Please pick state + city manually.')
      }
      setGeoBusy(false)
    }, (err) => {
      setGeoBusy(false)
      setGeoErr(err.code === err.PERMISSION_DENIED ? 'Permission denied — pick state + city manually.' : 'Could not detect location. Pick manually.')
    }, { timeout: 7000 })
  }

  const cls = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/15 dark:bg-[#1a2030] dark:text-white'
  const list = tab === 'firms' ? firms : lawyers

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-primary dark:text-white">Find a Barrister</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Search lawyers and law firms across India by location and name.</p>
            </div>
            <AccountChip />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto_auto]">
            <select value={state} onChange={(e) => { setState(e.target.value); setCity('') }} className={cls}>
              <option value="">All states</option>
              {INDIA_STATES.map((s) => <option key={s} value={s} className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white">{s}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!state} className={cls}>
              <option value="">{state ? 'All cities' : 'Pick state first'}</option>
              {cities.map((c) => <option key={c} value={c} className="bg-white text-slate-900 dark:bg-[#1a2030] dark:text-white">{c}</option>)}
            </select>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className={cls} />
            <button onClick={detectLocation} disabled={geoBusy} title="Use my location" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-white/15 dark:bg-[#1a2030] dark:text-slate-200">
              {geoBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />} My location
            </button>
            <button onClick={apply} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent">
              <Search className="h-3.5 w-3.5" /> Search
            </button>
          </div>
          {geoErr && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{geoErr}</p>}

          <nav className="mt-5 inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
            {(['lawyers', 'firms'] as const).map((id) => (
              <button
                key={id}
                onClick={() => { setTab(id); const p = new URLSearchParams(window.location.search); p.set('tab', id); router.push(`/find-barrister?${p.toString()}`) }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${tab === id ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 hover:text-primary dark:text-slate-300'}`}
              >
                {id === 'lawyers' ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                {id === 'lawyers' ? `Lawyers (${lawyers.length})` : `Firms (${firms.length})`}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-[#11151f] dark:text-slate-400">
            No matches. Try clearing filters or picking a different state.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item: any) => (
              <li key={item.id}>
                <button
                  onClick={() => setTarget({ kind: tab === 'firms' ? 'firm' : 'lawyer', data: item })}
                  className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#11151f]"
                >
                  {tab === 'lawyers' ? (
                    item.profileImage ? (
                      <img src={item.profileImage} alt={item.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover ring-2 ring-amber-200" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
                        {item.name.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                      </div>
                    )
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-primary dark:text-white">{item.name}</h3>
                    {tab === 'lawyers' && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.title}{item.firmName ? ` · ${item.firmName}` : ''}</p>
                    )}
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3 w-3" /> {[item.locality, item.city, item.state].filter(Boolean).join(', ') || 'Location not set'}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {target && <DetailsModal kind={target.kind} data={target.data} onClose={() => setTarget(null)} />}

      {intro && <IntroPoster onClose={closeIntro} onDetect={() => { closeIntro(); detectLocation() }} />}
    </div>
  )
}

function DetailsModal({ kind, data, onClose }: { kind: 'firm' | 'lawyer'; data: any; onClose: () => void }) {
  const { data: session } = useSession()
  const isSignedIn = !!session?.user?.email
  const [name, setName] = useState((session?.user?.name as string) || '')
  const [email, setEmail] = useState((session?.user?.email as string) || '')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'message' | 'chat' | 'video'>('message')

  useEffect(() => {
    if (session?.user?.email && !email) setEmail(session.user.email as string)
    if (session?.user?.name && !name) setName(session.user.name as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email])

  const tenantId = kind === 'firm' ? data.id : null
  const firmTenantId = kind === 'firm' ? data.id : (data.firmTenantId || null)
  const advocateId = kind === 'lawyer' ? data.id : null

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !message.trim()) { setError('Name, email, and message are required'); return }
    start(async () => {
      const r = await sendDirectoryMessage({
        kind,
        targetId: data.id,
        firmSlug: kind === 'firm' ? data.slug : data.firmSlug,
        fullName: name, email, phone, subject: `Find-Barrister inquiry — ${data.name}`, message,
      })
      if (!r.ok) { setError(r.error); return }
      setDone(true)
    })
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f] animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          {kind === 'lawyer' && data.profileImage ? (
            <img src={data.profileImage} alt="" className="h-20 w-20 flex-shrink-0 rounded-full object-cover ring-2 ring-amber-200" />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              {kind === 'lawyer' ? <User className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-primary dark:text-white">{data.name}</h2>
            {kind === 'lawyer' && <p className="text-xs text-slate-500 dark:text-slate-400">{data.title}{data.firmName ? ` · ${data.firmName}` : ''}</p>}
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3" /> {[data.locality, data.city, data.state].filter(Boolean).join(', ') || 'Location not set'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {kind === 'lawyer' && (data.expertise || data.bio) && (
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
            {data.expertise && <p className="text-xs text-slate-700 dark:text-slate-200"><strong>Expertise:</strong> {data.expertise}</p>}
            {data.bio && <p className="text-xs text-slate-700 dark:text-slate-200">{data.bio}</p>}
          </div>
        )}

        {/* Action shortcuts — Book button only when slots are available */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(data.firmSlug || (kind === 'firm' && data.slug)) && (
            data.hasSlots ? (
              <Link
                href={`/team/${data.firmSlug || data.slug}/book`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-200"
              >
                <Calendar className="h-3.5 w-3.5" /> Book consultation
              </Link>
            ) : (
              <span
                title="No upcoming slots available — use the message or live chat below."
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
              >
                <Calendar className="h-3.5 w-3.5" /> No slots available
              </span>
            )
          )}
        </div>

        <div className="mt-5 inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {([['message', Send, 'Message'], ['chat', MessageSquare, 'Live chat'], ['video', Video, 'Video call']] as const).map(([id, Ic, label]) => (
            <button key={id} onClick={() => setTab(id as any)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === id ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 hover:text-primary dark:text-slate-300'}`}>
              <Ic className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>

        {tab === 'message' && (done ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-500/30 dark:bg-emerald-900/20">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-2 font-semibold text-emerald-800 dark:text-emerald-100">Message sent</p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-200">{data.name} will receive your inquiry and reach out via email.</p>
          </div>
        ) : (
          <form onSubmit={send} className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Send a one-off message</p>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="Email *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Phone (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="Briefly describe your matter…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</p>}
            <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {pending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        ))}

        {tab === 'chat' && (
          isSignedIn
            ? <ChatPanel tenantId={firmTenantId} advocateId={advocateId} targetName={data.name} />
            : <SignInPrompt label="Sign in with Google to start a live chat with this lawyer" />
        )}

        {tab === 'video' && (
          isSignedIn
            ? <VideoRequestPanel tenantId={firmTenantId} advocateId={advocateId} targetName={data.name} />
            : <SignInPrompt label="Sign in with Google to request an instant video consultation" />
        )}
      </div>
    </div>
  )
}

function AccountChip() {
  const { data: session } = useSession()
  if (!session?.user?.email) {
    return (
      <button
        onClick={() => signIn('google', { callbackUrl: '/find-barrister/me' })}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-[#1a2030] dark:text-slate-200"
      >
        <LogIn className="h-3.5 w-3.5" /> Sign in
      </button>
    )
  }
  return (
    <Link href="/find-barrister/me" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-[#1a2030]">
      {(session.user as any).image ? (
        <img src={(session.user as any).image} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{(session.user.name || session.user.email || '?').slice(0, 1).toUpperCase()}</span>
      )}
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">My account</span>
    </Link>
  )
}

function SignInPrompt({ label }: { label: string }) {
  const [mode, setMode] = useState<'pick' | 'email' | 'otp'>('pick')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const requestOtp = async () => {
    setError('')
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('Enter a valid email'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/auth/email-otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Could not send code')
      setMode('otp')
    } catch (e: any) { setError(e?.message || 'Failed') }
    finally { setBusy(false) }
  }

  const verifyOtp = async () => {
    setError('')
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return }
    setBusy(true)
    const r = await signIn('email-otp', { redirect: false, email, otp, name, callbackUrl: '/find-barrister/me' })
    setBusy(false)
    if (r?.error || !r?.ok) { setError('Invalid or expired code'); return }
    window.location.href = '/find-barrister/me'
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-white/5">
      <LogIn className="mx-auto h-8 w-8 text-primary dark:text-amber-300" />
      <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>

      {mode === 'pick' && (
        <div className="mt-3 space-y-2">
          <button
            onClick={() => signIn('google', { callbackUrl: '/find-barrister/me' })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
          >
            <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden><path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3a12 12 0 1 1-3.3-13.1l5.7-5.7A20 20 0 1 0 44 24a20 20 0 0 0-.4-4z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" /><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.6 28l-6.6 5A20 20 0 0 0 24 44z" /><path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3a12 12 0 0 1-4 5.5l6.2 5.3A20 20 0 0 0 44 24a20 20 0 0 0-.4-4z" /></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex-1 border-t border-slate-200 dark:border-white/10" /> or <span className="flex-1 border-t border-slate-200 dark:border-white/10" />
          </div>
          <button onClick={() => setMode('email')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
            Continue with email
          </button>
        </div>
      )}

      {mode === 'email' && (
        <div className="mt-3 space-y-2 text-left">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={requestOtp} disabled={busy} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{busy ? 'Sending…' : 'Send verification code'}
          </button>
          <button onClick={() => setMode('pick')} className="block w-full text-center text-[11px] text-slate-500 hover:underline">Back</button>
        </div>
      )}

      {mode === 'otp' && (
        <div className="mt-3 space-y-2 text-left">
          <p className="text-xs text-slate-500 dark:text-slate-400">Code sent to <strong>{email}</strong>. Expires in 10 minutes.</p>
          <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} required placeholder="123456" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] dark:border-white/15 dark:bg-[#1a2030] dark:text-white" />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={verifyOtp} disabled={busy || otp.length !== 6} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{busy ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button onClick={() => setMode('email')} className="block w-full text-center text-[11px] text-slate-500 hover:underline">Wrong email?</button>
        </div>
      )}
    </div>
  )
}

function ChatPanel({ tenantId, advocateId, targetName }: { tenantId: string; advocateId: string | null; targetName: string }) {
  const [thread, setThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      if (!thread?.id) return
      const r = await fetch(`/api/dm?threadId=${thread.id}`, { cache: 'no-store' })
      if (!r.ok) return
      const data = await r.json()
      setMessages(data.messages || [])
    } catch {}
  }

  useEffect(() => {
    if (!thread?.id) return
    load()
    // 1.5 s polling for near-real-time chat in the directory modal.
    const i = window.setInterval(load, 1500)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { window.clearInterval(i); window.removeEventListener('focus', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!body.trim() || sending) return
    setError(''); setSending(true)
    try {
      const payload: any = { body: body.trim() }
      if (thread?.id) payload.threadId = thread.id
      else { payload.tenantId = tenantId; payload.advocateId = advocateId; payload.subject = `Chat with ${targetName}` }
      const r = await fetch('/api/dm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      if (!thread?.id) setThread(data.thread)
      setMessages((m) => [...m, data.message])
      setBody('')
    } catch (e: any) { setError(e?.message || 'Send failed') }
    finally { setSending(false) }
  }

  return (
    <div className="mt-5 flex h-80 flex-col rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e1219]">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No messages yet. Say hi.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.senderType === 'client' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100'}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-slate-200 p-2 dark:border-white/10">
        {error && <p className="mb-1 text-xs text-rose-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Message ${targetName}…`}
            rows={1}
            className="max-h-20 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-white/15 dark:bg-[#1a2030] dark:text-white"
          />
          <button onClick={send} disabled={sending || !body.trim()} className="rounded-lg bg-primary p-2 text-white disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function VideoRequestPanel({ tenantId, advocateId, targetName }: { tenantId: string; advocateId: string | null; targetName: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [joinUrl, setJoinUrl] = useState('')

  const request = async () => {
    setError(''); setBusy(true)
    try {
      const r = await fetch('/api/livekit/instant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId, advocateId }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setJoinUrl(data.joinUrl)
    } catch (e: any) { setError(e?.message || 'Could not start the call') }
    finally { setBusy(false) }
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-white/5">
      <Video className="mx-auto h-8 w-8 text-primary dark:text-amber-300" />
      <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Instant video consultation</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">We'll email {targetName} a join link. Open your end first and they'll connect when they accept.</p>
      {!joinUrl ? (
        <button onClick={request} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {busy ? 'Starting…' : 'Request video call'}
        </button>
      ) : (
        <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Video className="h-4 w-4" /> Open my video room
        </a>
      )}
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  )
}

const SLIDES = [
  {
    icon: Search,
    title: 'Find a barrister near you',
    body: 'Filter Indian lawyers and law firms by state, city, and locality. Every PIN-code locality is searchable via India Post.',
    color: 'from-[#14203E] via-[#1c2c52] to-[#B7913D]',
    chip: '28 states · UTs · 700+ cities',
  },
  {
    icon: Crosshair,
    title: 'Auto-detect your location',
    body: 'One tap and we snap to the closest metro using your browser GPS. Permission-denied? Pick manually in two clicks.',
    color: 'from-emerald-600 via-emerald-500 to-amber-400',
    chip: 'Browser geolocation · no tracking',
  },
  {
    icon: User,
    title: 'Profiles with photos',
    body: 'Each lawyer / firm card shows a portrait, title, expertise, location, and bio — uploaded by the firm itself.',
    color: 'from-fuchsia-600 via-rose-500 to-amber-400',
    chip: 'PNG / JPEG / WebP · 5 MB',
  },
  {
    icon: MessageSquare,
    title: 'Send a direct message',
    body: 'Open any profile, fill out a short form, and your inquiry lands in their inquiries tab — with email notification.',
    color: 'from-sky-600 via-cyan-500 to-emerald-400',
    chip: 'Routes straight to their inbox',
  },
  {
    icon: Sparkles,
    title: 'More on the way',
    body: 'Live chat, video calls and Google sign-in are next. Today, you have the full directory — keep an eye out for updates.',
    color: 'from-amber-500 via-orange-500 to-rose-500',
    chip: 'Live chat · video · Google SSO',
  },
]

function IntroPoster({ onClose, onDetect }: { onClose: () => void; onDetect: () => void }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setIdx((n) => (n + 1) % SLIDES.length), 4500)
    return () => window.clearInterval(t)
  }, [])
  const slide = SLIDES[idx]
  const Icon = slide.icon

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-[#0e1219] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated gradient hero */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${slide.color} transition-colors duration-700`}>
          {/* decorative glyphs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <Scale className="pointer-events-none absolute right-6 top-6 h-7 w-7 text-white/40" />
          <div className="relative px-8 pb-14 pt-12 text-center text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" /> New feature
            </span>
            <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{slide.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85 md:text-base">{slide.body}</p>
            <p className="mt-4 inline-block rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
              {slide.chip}
            </p>
          </div>

          {/* Pager controls */}
          <button
            onClick={() => setIdx((n) => (n - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIdx((n) => (n + 1) % SLIDES.length)}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-white hover:bg-black/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Footer with dots + CTAs */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0e1219]">
          <div className="flex items-center justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-white/20'}`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-col items-stretch justify-center gap-2 sm:flex-row">
            <button
              onClick={onDetect}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-accent"
            >
              <Crosshair className="h-4 w-4" /> Use my location
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-[#11151f] dark:text-slate-200 dark:hover:bg-white/10"
            >
              Browse manually
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
