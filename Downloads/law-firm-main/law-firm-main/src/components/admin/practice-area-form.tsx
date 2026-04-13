'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPracticeArea, updatePracticeArea } from '@/app/admin/(authenticated)/practice-areas/actions'
import type { PracticeArea } from '@prisma/client'
import { Loader2, Save, X, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from './image-upload'
import { IconPicker } from './icon-picker'

interface PracticeAreaFormProps {
  initialData?: PracticeArea | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function PracticeAreaForm({ initialData, onSuccess, onCancel }: PracticeAreaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(initialData?.image || '')
  const [icon, setIcon] = useState(initialData?.icon || 'Briefcase')
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      if (initialData) {
        if (!confirm('Are you sure you want to update this service?')) {
          setLoading(false)
          return
        }
        await updatePracticeArea(initialData.id, formData)
      } else {
        await createPracticeArea(formData)
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Service Title</label>
            <input
              required
              name="title"
              defaultValue={initialData?.title}
              onChange={(e) => {
                const slugInput = document.querySelector('input[name="slug"]') as HTMLInputElement
                if (slugInput && !initialData) {
                  slugInput.value = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                }
              }}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
              placeholder="e.g. Corporate Law"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Slug</label>
            <input
              required
              name="slug"
              defaultValue={initialData?.slug}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-mono text-sm"
              placeholder="corporate-law"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Short Description</label>
          <textarea
            required
            name="description"
            defaultValue={initialData?.description}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
            placeholder="A brief overview of the service for the home page cards..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Detailed Content</label>
          <textarea
            name="content"
            defaultValue={initialData?.content || ''}
            rows={10}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none font-sans"
            placeholder="Detailed information about this practice area that will appear on the individual service page..."
          />
        <div className="space-y-2">
           <input type="hidden" name="image" value={image} />
           <ImageUpload 
             label="Service Hero Image"
             value={image}
             onChange={setImage}
           />
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Detailed information about this practice area that will appear on the individual service page.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <input type="hidden" name="icon" value={icon} />
            <IconPicker 
              label="Service Icon"
              value={icon}
              onChange={setIcon}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Display Order</label>
            <input
              type="number"
              name="order"
              defaultValue={initialData?.order || 0}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={initialData?.isActive ?? true}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active / Visible</label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {initialData ? 'Update Service' : 'Create Service'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>
    </form>
  )
}
