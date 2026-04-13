'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface TeamMember {
  id: string
  name: string
  title: string
  bio: string
  image?: string | null
  expertise?: string | null
  education?: string | null
  email?: string | null
  phone?: string | null
  linkedin?: string | null
  order: number
  isActive: boolean
}

interface TeamFormProps {
  initialData?: TeamMember | null
  onSave: (formData: FormData) => Promise<void>
  onCancel: () => void
}

export function TeamForm({ initialData, onSave, onCancel }: TeamFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(initialData?.image || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setImageUrl(data.url)
    } catch {
      setError('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('image', imageUrl)
      await onSave(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5'
  const inputClass = 'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-navy-900 outline-none focus:ring-2 focus:ring-navy-900/10 transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Photo Upload */}
      <div>
        <label className={labelClass}>Photo</label>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
            {imageUrl ? (
              <Image src={imageUrl} alt="Preview" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">Photo</div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input name="name" defaultValue={initialData?.name || ''} required className={inputClass} placeholder="Adv. Rajesh Kumar" />
        </div>
        <div>
          <label className={labelClass}>Title / Designation *</label>
          <input name="title" defaultValue={initialData?.title || ''} required className={inputClass} placeholder="Senior Partner" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Bio *</label>
        <textarea
          name="bio"
          defaultValue={initialData?.bio || ''}
          required
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Brief professional biography..."
        />
      </div>

      <div>
        <label className={labelClass}>Areas of Expertise</label>
        <input name="expertise" defaultValue={initialData?.expertise || ''} className={inputClass} placeholder="Corporate Law, Litigation, Family Law" />
      </div>

      <div>
        <label className={labelClass}>Education</label>
        <input name="education" defaultValue={initialData?.education || ''} className={inputClass} placeholder="LL.B., University of Mumbai | LL.M., Harvard" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" defaultValue={initialData?.email || ''} className={inputClass} placeholder="advocate@firm.com" />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" defaultValue={initialData?.phone || ''} className={inputClass} placeholder="+91 98765 43210" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>LinkedIn URL</label>
          <input name="linkedin" defaultValue={initialData?.linkedin || ''} className={inputClass} placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label className={labelClass}>Display Order</label>
          <input name="order" type="number" defaultValue={initialData?.order ?? 0} className={inputClass} min={0} />
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          value="true"
          defaultChecked={initialData?.isActive !== false}
          className="w-4 h-4 rounded accent-navy-900"
        />
        <label htmlFor="isActive" className="text-sm font-bold text-navy-900 cursor-pointer">
          Show on About page (visible to site visitors)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="py-3.5 rounded-2xl border border-slate-200 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="py-3.5 rounded-2xl bg-navy-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-navy-900/20 disabled:opacity-50"
        >
          {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</span> : initialData ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}
