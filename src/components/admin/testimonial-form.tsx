'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTestimonial, updateTestimonial } from '@/app/admin/(authenticated)/testimonials/actions'
import type { Testimonial } from '@prisma/client'
import { Loader2, Save, X, Star, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from './image-upload'

interface TestimonialFormProps {
  initialData?: Testimonial | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function TestimonialForm({ initialData, onSuccess, onCancel }: TestimonialFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(initialData?.rating || 5)
  const [image, setImage] = useState(initialData?.image || '')
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (initialData && !confirm('Save changes to this testimonial?')) return
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.set('rating', rating.toString())
    formData.set('image', image)
    
    try {
      if (initialData) {
        await updateTestimonial(initialData.id, formData)
      } else {
        await createTestimonial(formData)
      }
      onSuccess?.()
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
             <ImageUpload 
               label="Client Image"
               value={image}
               onChange={setImage}
               className="mb-6"
             />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Client Name</label>
            <input
              required
              name="name"
              defaultValue={initialData?.name}
              className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all font-bold"
              placeholder="e.g. Rajesh Kumar"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Role / Designation</label>
            <input
              name="role"
              defaultValue={initialData?.role || ''}
              className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all"
              placeholder="e.g. CEO, Tech Corp"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Rating</label>
            <div className="flex gap-2 p-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="transition-transform active:scale-90"
                >
                  <Star className={cn("w-8 h-8", s <= rating ? "fill-gold-500 text-gold-500" : "text-gray-200")} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Testimonial Content</label>
            <textarea
              required
              name="content"
              defaultValue={initialData?.content}
              rows={4}
              className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all resize-none"
              placeholder="What did they say about your service?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Display Order</label>
              <input
                name="order"
                type="number"
                defaultValue={initialData?.order || 0}
                className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-3 pt-6">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={initialData?.isActive ?? true}
                className="w-5 h-5 rounded border-gray-300 text-navy-900 focus:ring-navy-900"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Display Live</label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-10 py-4 bg-navy-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-navy-900/10"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {initialData ? 'Update Testimonial' : 'Publish Success Story'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>
    </form>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
