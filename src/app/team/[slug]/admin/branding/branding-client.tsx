'use client'

import { useState, useTransition } from 'react'
import { updateBranding } from './actions'
import { Loader2, Save, RotateCcw, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadImage } from '@/app/admin/actions/upload'

const DEFAULTS = {
  primaryColor: '#14203E',
  secondaryColor: '#c9a227',
  accentColor: '#1d2c52',
  borderRadius: '0.5rem',
  fontFamily: 'sans',
}

export function BrandingClient({ slug, theme, firmName }: { slug: string; theme: any; firmName: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const initial = {
    primaryColor: theme.primaryColor || DEFAULTS.primaryColor,
    secondaryColor: theme.secondaryColor || DEFAULTS.secondaryColor,
    accentColor: theme.accentColor || DEFAULTS.accentColor,
    borderRadius: theme.borderRadius || DEFAULTS.borderRadius,
    fontFamily: theme.fontFamily || DEFAULTS.fontFamily,
    logoUrl: theme.logoUrl || '',
  }

  const [primaryColor, setPrimary] = useState(initial.primaryColor)
  const [secondaryColor, setSecondary] = useState(initial.secondaryColor)
  const [accentColor, setAccent] = useState(initial.accentColor)
  const [borderRadius, setRadius] = useState(initial.borderRadius)
  const [fontFamily, setFont] = useState(initial.fontFamily)
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

  const onPickIconPng = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > 2 * 1024 * 1024) { setUploadError('Icon PNG must be under 2 MB'); e.target.value = ''; return }
    if (file.type !== 'image/png' && file.type !== 'image/svg+xml') {
      // We accept any image but recommend PNG for best favicon results.
      if (!file.type.startsWith('image/')) { setUploadError('Pick an image file (PNG recommended).'); e.target.value = ''; return }
    }
    setUploading(true)
    try {
      const fd = new FormData(); fd.set('file', file)
      const url = await uploadImage(fd)
      setLogoUrl(url)
    } catch (err: any) { setUploadError(err?.message || 'Upload failed') }
    finally { setUploading(false); e.target.value = '' }
  }

  const reset = () => {
    setPrimary(initial.primaryColor)
    setSecondary(initial.secondaryColor)
    setAccent(initial.accentColor)
    setRadius(initial.borderRadius)
    setFont(initial.fontFamily)
    setLogoUrl(initial.logoUrl)
    setStatus(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus(null)
    const fd = new FormData()
    fd.set('primaryColor', primaryColor)
    fd.set('secondaryColor', secondaryColor)
    fd.set('accentColor', accentColor)
    fd.set('navbarColor', theme.navbarColor || primaryColor)
    fd.set('footerColor', theme.footerColor || primaryColor)
    fd.set('borderRadius', borderRadius)
    fd.set('fontFamily', fontFamily)
    fd.set('logoUrl', logoUrl)
    // Site title always reflects the firm name; no separate field.
    fd.set('siteTitle', firmName)
    start(async () => {
      try {
        await updateBranding(slug, fd)
        setStatus({ type: 'success', message: 'Branding updated.' })
        router.refresh()
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || 'Failed to update branding' })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <strong className="text-primary dark:text-white">Site title</strong> automatically uses your firm name: <em>{firmName}</em>.
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFont(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              <option value="sans">Sans-serif (Modern)</option>
              <option value="serif">Serif (Classic/Legal)</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Border Radius</label>
            <input
              value={borderRadius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">e.g. '0.5rem', '0px', '1rem'.</p>
          </div>
          {[
            { label: 'Primary Color', value: primaryColor, set: setPrimary, hint: 'Main brand color (e.g., Navy Blue).' },
            { label: 'Secondary / Gold Color', value: secondaryColor, set: setSecondary, hint: 'Accent buttons (e.g., Gold).' },
            { label: 'Accent Color', value: accentColor, set: setAccent, hint: 'Hover / secondary backgrounds.' },
          ].map((c) => (
            <div key={c.label}>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{c.label}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={c.value} onChange={(e) => c.set(e.target.value)} className="h-9 w-14 cursor-pointer rounded" />
                <input type="text" value={c.value} onChange={(e) => c.set(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs dark:border-white/15 dark:bg-white/5 dark:text-white" />
              </div>
              <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Logo (PNG/SVG, ≤ 2 MB)</label>
          <p className="mb-3 text-xs text-slate-500">Upload your logo. We will automatically use it as your browser icon too.</p>
          {logoUrl ? (
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-md border border-slate-200 object-contain" />
              <code className="truncate text-xs text-slate-500">{logoUrl}</code>
              <button type="button" onClick={() => { setLogoUrl('') }} className="ml-auto inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50">
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          ) : (
            <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-xs text-slate-500 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="mt-2">{uploading ? 'Uploading…' : 'Click to upload a PNG / SVG'}</span>
              <input type="file" accept="image/png,image/svg+xml,image/*" onChange={onPickIconPng} disabled={uploading} className="hidden" />
            </label>
          )}
          {uploadError && <p className="mt-2 text-xs text-rose-600">{uploadError}</p>}
        </div>

        {status && (
          <div className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {status.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? 'Saving…' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  )
}
