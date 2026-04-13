'use client'

import { useState } from 'react'
import { Plus, Edit, Star, Quote, Search, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AdminDialog } from './admin-dialog'
import { TestimonialForm } from './testimonial-form'
import { DeleteButton } from './delete-button'
import type { Testimonial } from '@prisma/client'
import { cn } from '@/lib/utils'

interface TestimonialManagerProps {
  initialData: Testimonial[]
  deleteAction: (formData: FormData) => Promise<void>
}

export function TestimonialManager({ initialData, deleteAction }: TestimonialManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState('')

  const modalType = searchParams.get('modal')
  const editingId = searchParams.get('id')
  const isModalOpen = modalType === 'testimonial'
  const editingItem = editingId ? data.find(item => item.id === editingId) || null : null

  const openModal = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'testimonial')
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
  const handleEdit = (item: Testimonial) => openModal(item.id)

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stories..."
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
          Add Story
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredData.map((t) => (
          <div key={t.id} className="card-3d bg-white p-8 rounded-[2.5rem] border border-gray-50 group relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex text-gold-500">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(t)}
                  className="p-2 text-gray-400 hover:text-navy-900 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <DeleteButton id={t.id} action={deleteAction} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" />
              </div>
            </div>
            
            <div className="relative mb-8 flex-1">
              <Quote className="w-8 h-8 text-navy-900/5 absolute -top-4 -left-4" />
              <p className="text-gray-600 text-sm italic leading-relaxed relative z-10 line-clamp-6 font-medium">
                "{t.content}"
              </p>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
              <div className="w-12 h-12 bg-navy-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-xl shadow-navy-900/10">
                {t.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-black text-navy-900 uppercase text-xs tracking-tighter">{t.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.role}</p>
              </div>
            </div>

            {!t.isActive && (
              <div className="absolute top-0 right-12 p-3">
                <span className="bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-red-100">Hidden</span>
              </div>
            )}
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4">
             <Sparkles className="w-12 h-12 text-gray-200" />
             <p className="text-sm font-black uppercase tracking-widest text-gray-400">No client stories matched your search</p>
          </div>
        )}
      </div>

      <AdminDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Success Story' : 'New Success Story'}
        description={editingItem ? `Updating: ${editingItem.name}` : 'Document a client victory'}
      >
        <TestimonialForm 
          initialData={editingItem} 
          onSuccess={() => { closeModal(); router.refresh(); }} 
          onCancel={closeModal}
        />
      </AdminDialog>
    </div>
  )
}
