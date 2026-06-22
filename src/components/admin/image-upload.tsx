'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImage } from '@/app/admin/actions/upload'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  className?: string
  accept?: string
  previewType?: 'cover' | 'icon'
}

export function ImageUpload({
  value,
  onChange,
  label,
  className,
  accept = '.ico,.png,.jpg,.jpeg,.svg,.webp,image/*',
  previewType = 'cover'
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(value || '')
  const [previewFailed, setPreviewFailed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) {
      setPreviewUrl(value || '')
      setPreviewFailed(false)
    }
  }, [value, loading])

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setPreviewFailed(false)
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const url = await uploadImage(formData)
      if (objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl)
      }
      onChange(url)
    } catch (error) {
      console.error('Upload failed:', error)
      setPreviewUrl(value || '')
      setPreviewFailed(false)
      alert('Upload failed. Please try again.')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {label && <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</label>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center min-h-[160px]",
          previewUrl ? "border-solid border-gray-100 bg-gray-50" : "border-gray-200 hover:border-navy-900 bg-gray-50/50 hover:bg-gray-50"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept={accept}
          onChange={handleUpload}
          disabled={loading}
        />

        {previewUrl ? (
          <div className="w-full h-full group">
            {previewType === 'icon' ? (
              <div className="flex min-h-[160px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-xl">
                  <div className="mb-3 flex items-center gap-2 rounded-t-lg border-b border-slate-100 pb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </div>
                  {!previewFailed ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto h-12 w-12 rounded-xl object-contain"
                      onError={() => setPreviewFailed(true)}
                    />
                  ) : (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#14203E] text-[10px] font-black uppercase tracking-widest text-white">
                      ICO
                    </div>
                  )}
                </div>
              </div>
            ) : !previewFailed ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-40 object-cover"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#14203E] shadow-lg">
                  Preview unavailable
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change Image</span>
            </div>
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Uploading...</span>
              </div>
            )}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3">
             <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               {previewType === 'icon' ? 'Processing favicon...' : 'Uploading...'}
             </span>
             {previewType === 'icon' && (
               <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#14203E]">
                 ETA 5-10s
               </span>
             )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-navy-900 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-tight">Click or Drag to Upload</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">PNG, JPG up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
