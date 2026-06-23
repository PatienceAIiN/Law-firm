'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Loader2, Upload, X } from 'lucide-react'
import { createBlogPost, deleteBlogPost } from '../actions'
import { uploadImage } from '@/app/admin/actions/upload'

type B = { id: string; title: string; slug: string; status: string; coverImage?: string | null; excerpt?: string | null }

const MAX_BYTES = 5 * 1024 * 1024

export function ArticlesClient({ slug, items }: { slug: string; items: B[] }) {
  const [pending, start] = useTransition()
  const [cover, setCover] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > MAX_BYTES) {
      setUploadError(`Cover image must be under 5 MB (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB)`)
      e.target.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Pick an image file (PNG, JPG, WebP, SVG).')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const url = await uploadImage(fd)
      setCover(url)
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('coverImage', cover)
    start(async () => {
      await createBlogPost(slug, fd)
      setCover('')
      formRef.current?.reset()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        <form ref={formRef} onSubmit={onCreate} className="space-y-3">
          {/* Cover image picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cover image (max 5 MB)</label>
            {cover ? (
              <div className="relative">
                <img src={cover} alt="Cover preview" className="h-44 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setCover('')}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span className="mt-2 text-xs">{uploading ? 'Uploading…' : 'Click to upload an image'}</span>
                <input type="file" accept="image/*" onChange={onPickFile} disabled={uploading} className="hidden" />
              </label>
            )}
            {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
          </div>

          <input name="title" required placeholder="Article title" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="excerpt" placeholder="Short summary (shown on listing)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <textarea name="content" rows={5} placeholder="Write your article…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#14203E] dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending || uploading} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Publish article
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No articles yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                {b.coverImage ? (
                  <img src={b.coverImage} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-12 w-16 shrink-0 rounded bg-slate-100 dark:bg-white/5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#14203E] dark:text-white">{b.title}</p>
                  <p className="truncate text-xs text-slate-500">{b.slug} · {b.status}</p>
                </div>
                <form action={async () => { await deleteBlogPost(slug, b.id) }}>
                  <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
