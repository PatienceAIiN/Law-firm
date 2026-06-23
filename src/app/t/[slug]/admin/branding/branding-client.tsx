'use client'

import { useState, useTransition } from 'react'
import { updateBranding } from './actions'
import { Loader2, Save } from 'lucide-react'

export function BrandingClient({ slug, theme }: { slug: string; theme: any }) {
  const [pending, start] = useTransition()
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus(null)
    const fd = new FormData(e.currentTarget)
    start(async () => {
      try {
        await updateBranding(slug, fd)
        setStatus({ type: 'success', message: 'Branding updated successfully. Please refresh the page to see all changes.' })
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || 'Failed to update branding' })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Site Title</label>
            <input
              name="siteTitle"
              defaultValue={theme.siteTitle}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">The title displayed in the browser tab.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Font Family</label>
            <select
              name="fontFamily"
              defaultValue={theme.fontFamily}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              <option value="sans">Sans-serif (Modern)</option>
              <option value="serif">Serif (Classic/Legal)</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Primary Color (Hex)</label>
            <div className="flex items-center gap-3">
              <input type="color" name="primaryColor" defaultValue={theme.primaryColor} className="h-9 w-14 rounded cursor-pointer" />
              <input type="text" defaultValue={theme.primaryColor} readOnly className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white opacity-70" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Main brand color (e.g., Navy Blue).</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Secondary/Gold Color (Hex)</label>
            <div className="flex items-center gap-3">
              <input type="color" name="secondaryColor" defaultValue={theme.secondaryColor} className="h-9 w-14 rounded cursor-pointer" />
              <input type="text" defaultValue={theme.secondaryColor} readOnly className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white opacity-70" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Accent elements like buttons (e.g., Gold).</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Accent Color (Hex)</label>
            <div className="flex items-center gap-3">
              <input type="color" name="accentColor" defaultValue={theme.accentColor} className="h-9 w-14 rounded cursor-pointer" />
              <input type="text" defaultValue={theme.accentColor} readOnly className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white opacity-70" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Secondary backgrounds or hover states.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Border Radius</label>
            <input
              name="borderRadius"
              defaultValue={theme.borderRadius}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">e.g. '0.5rem', '0px', '1rem'.</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Logo URL</label>
            <input
              name="logoUrl"
              defaultValue={theme.logoUrl}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">Public URL of your transparent logo.</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Favicon URL</label>
            <input
              name="faviconUrl"
              defaultValue={theme.faviconUrl}
              placeholder="https://example.com/favicon.ico"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">Public URL for the browser tab icon.</p>
          </div>
        </div>

        {/* Hidden fields for globals so we don't break the shape if it's reused */}
        <input type="hidden" name="navbarColor" value={theme.navbarColor} />
        <input type="hidden" name="footerColor" value={theme.footerColor} />

        {status && (
          <div className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {status.message}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  )
}
