'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Upload, X, Edit, Save } from 'lucide-react'
import { uploadImage } from '@/app/admin/actions/upload'
import { createTeamMember, deleteTeamMember, updateTeamMember } from './actions'
import { DeleteButton } from '@/components/ui/delete-button'

type M = { id: string; name: string; title: string; bio: string; email: string | null; image: string | null; isActive: boolean }

const MAX_BYTES = 10 * 1024 * 1024

// Client-side resize/compress: reads the file into a canvas, downscales to a
// max dimension, re-encodes as JPEG at ~0.82 quality. Result is typically
// 80-95% smaller than the source while still print-quality at card size.
async function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = URL.createObjectURL(file)
  })
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, w, h)
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  URL.revokeObjectURL(img.src)
  if (!blob) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

export function TeamClient({ slug, items }: { slug: string; items: M[] }) {
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState<M | null>(null)
  const router = useRouter()

  return (
    <div className="space-y-4">
      <MemberForm
        slug={slug}
        key={editing ? `edit-${editing.id}` : 'new'}
        initial={editing}
        onSaved={() => { setEditing(null); router.refresh() }}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No team members yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-4 py-3">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-500 dark:bg-white/10 dark:text-white">
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.title}{m.email ? ` · ${m.email}` : ''}</p>
                  {m.bio && <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{m.bio}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing(m)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <DeleteButton
                    onDelete={() => deleteTeamMember(slug, m.id)}
                    className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                    title="Delete"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MemberForm({
  slug, initial, onSaved, onCancel,
}: {
  slug: string
  initial: M | null
  onSaved: () => void
  onCancel?: () => void
}) {
  const [pending, start] = useTransition()
  const [image, setImage] = useState<string>(initial?.image || '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > MAX_BYTES) { setUploadError('Image must be under 10 MB.'); e.target.value = ''; return }
    if (!file.type.startsWith('image/')) { setUploadError('Pick an image.'); e.target.value = ''; return }
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const fd = new FormData(); fd.set('file', compressed)
      const url = await uploadImage(fd)
      setImage(url)
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed')
    } finally {
      setUploading(false); if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('image', image)
    start(async () => {
      if (initial) await updateTeamMember(slug, initial.id, fd)
      else await createTeamMember(slug, fd)
      onSaved()
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
      <h3 className="mb-3 text-sm font-bold text-primary dark:text-white">{initial ? `Edit ${initial.name}` : 'Add team member'}</h3>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div>
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="h-28 w-28 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setImage('')}
                className="absolute right-1 top-1 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="mt-1">{uploading ? 'Uploading…' : 'Photo (≤10MB)'}</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPick} disabled={uploading} className="hidden" />
            </label>
          )}
          {uploadError && <p className="mt-1 text-[11px] text-rose-600">{uploadError}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" defaultValue={initial?.name || ''} required placeholder="Name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="title" defaultValue={initial?.title || ''} placeholder="Title (e.g. Associate)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="email" defaultValue={initial?.email || ''} type="email" placeholder="Email (optional)" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <textarea name="bio" defaultValue={initial?.bio || ''} rows={2} placeholder="Short bio" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <div className="sm:col-span-2 flex justify-end gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Cancel</button>
            )}
            <button disabled={pending || uploading} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : (initial ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
              {initial ? 'Save changes' : 'Add member'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
