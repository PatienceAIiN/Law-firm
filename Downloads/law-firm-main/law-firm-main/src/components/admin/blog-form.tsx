'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBlog, updateBlog } from '@/app/admin/(authenticated)/blogs/actions'
import type { BlogPost } from '@prisma/client'
import { Loader2, Save, X, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from './image-upload'

interface BlogFormProps {
  initialData?: BlogPost | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function BlogForm({ initialData, onSuccess, onCancel }: BlogFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '')
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      if (initialData) {
        if (!confirm('Are you sure you want to save these changes?')) {
          setLoading(false)
          return
        }
        await updateBlog(initialData.id, formData)
      } else {
        await createBlog(formData)
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
            <label className="text-sm font-semibold text-gray-700">Title</label>
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
              placeholder="Enter article title"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Slug (URL Path)</label>
            <input
              required
              name="slug"
              defaultValue={initialData?.slug}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-mono text-sm"
              placeholder="article-slug-here"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Excerpt (Short Summary)</label>
          <textarea
            name="excerpt"
            defaultValue={initialData?.excerpt || ''}
            rows={2}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
            placeholder="A brief summary for the blog listing page..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Content (HTML allowed)</label>
          <textarea
            required
            name="content"
            defaultValue={initialData?.content}
            rows={12}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-mono text-sm"
            placeholder="Write your article content here..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <select
              name="status"
              defaultValue={initialData?.status || 'DRAFT'}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <input type="hidden" name="coverImage" value={coverImage} />
            <ImageUpload 
              label="Cover Image"
              value={coverImage}
              onChange={setCoverImage}
            />
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
          {initialData ? 'Update Article' : 'Create Article'}
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
