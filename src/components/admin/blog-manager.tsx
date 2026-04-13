'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Eye, Search, Filter, Loader2 } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { AdminDialog } from './admin-dialog'
import { BlogForm } from './blog-form'
import { DeleteButton } from './delete-button'
import type { BlogPost } from '@prisma/client'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'

interface BlogManagerProps {
  initialBlogs: BlogPost[]
  deleteAction: (formData: FormData) => Promise<void>
}

export function BlogManager({ initialBlogs, deleteAction }: BlogManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [blogs, setBlogs] = useState(initialBlogs)
  const [searchQuery, setSearchQuery] = useState('')

  const modalType = searchParams.get('modal')
  const editingId = searchParams.get('id')
  const isModalOpen = modalType === 'blog'
  const editingBlog = editingId ? blogs.find(b => b.id === editingId) || null : null

  const openModal = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'blog')
    if (id) params.set('id', id)
    else params.delete('id')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('modal')
    params.delete('id')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCreate = () => openModal()
  const handleEdit = (blog: BlogPost) => openModal(blog.id)

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    blog.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-navy-900/5 transition-all text-sm font-medium shadow-sm"
          />
        </div>
        
        <button 
          onClick={handleCreate}
          className="flex items-center px-6 py-3 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-navy-900/20 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </button>
      </div>

      <div className="bg-white card-3d rounded-[2.5rem] border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Article Details</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Publish Date</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-navy-900 uppercase tracking-tighter">{blog.title}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{blog.slug}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full",
                      blog.status === 'PUBLISHED' 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : blog.status === 'DRAFT'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        : 'bg-gray-50 text-gray-700 border border-gray-100'
                    )}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-gray-500">
                    {formatDate(blog.createdAt, 'MMMM dd, yyyy')}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Link 
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-navy-900 hover:bg-white rounded-xl transition-all"
                        title="View Live"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleEdit(blog)}
                        className="p-2 text-gray-400 hover:text-navy-900 hover:bg-white rounded-xl transition-all"
                        title="Quick Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <DeleteButton id={blog.id} action={deleteAction} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBlogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <Filter className="w-8 h-8 text-gray-200" />
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">No articles found matching "{searchQuery}"</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBlog ? 'Edit Article' : 'Create New Article'}
        description={editingBlog ? `Modifying: ${editingBlog.title}` : 'Draft a new publication for your law firm'}
      >
        <BlogForm 
          initialData={editingBlog} 
          onSuccess={() => { closeModal(); router.refresh(); }} 
          onCancel={closeModal}
        />
      </AdminDialog>
    </div>
  )
}
