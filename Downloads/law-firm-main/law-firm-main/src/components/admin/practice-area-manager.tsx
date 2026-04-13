'use client'

import { useState } from 'react'
import { Plus, Edit, Search, Briefcase, Loader2, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AdminDialog } from './admin-dialog'
import { PracticeAreaForm } from './practice-area-form'
import { DeleteButton } from './delete-button'
import type { PracticeArea } from '@prisma/client'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { cn } from '@/lib/utils'

interface PracticeAreaManagerProps {
  initialData: PracticeArea[]
  deleteAction: (formData: FormData) => Promise<void>
}

export function PracticeAreaManager({ initialData, deleteAction }: PracticeAreaManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState('')

  const modalType = searchParams.get('modal')
  const editingId = searchParams.get('id')
  const isModalOpen = modalType === 'service'
  const editingItem = editingId ? data.find(item => item.id === editingId) || null : null

  const openModal = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'service')
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
  const handleEdit = (item: PracticeArea) => openModal(item.id)

  const filteredData = data.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
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
          Add Practice Area
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((area) => (
          <div key={area.id} className="card-3d bg-white p-8 rounded-[2rem] border border-gray-50 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur-md rounded-bl-2xl border-l border-b border-gray-50 z-10">
              <button 
                onClick={() => handleEdit(area)}
                className="p-2 text-gray-400 hover:text-navy-900 hover:bg-white rounded-xl transition-all"
              >
                <Edit className="w-4 h-4" />
              </button>
              <DeleteButton id={area.id} action={deleteAction} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" />
            </div>

            <div className="space-y-6">
              <div className="w-14 h-14 bg-navy-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-navy-900/10 group-hover:scale-110 transition-transform duration-500">
                <DynamicIcon name={area.icon} fallback={Briefcase} className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-black text-navy-900 uppercase tracking-tighter mb-2">{area.title}</h3>
                <p className="text-gray-500 text-sm font-medium line-clamp-3 leading-relaxed">{area.description}</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                   <div className={cn(
                     "w-2 h-2 rounded-full",
                     area.isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"
                   )} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                     {area.isActive ? 'Live' : 'Hidden'}
                   </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  Order: {area.order}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4">
             <Sparkles className="w-12 h-12 text-gray-200" />
             <p className="text-sm font-black uppercase tracking-widest text-gray-400">No services found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      <AdminDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Practice Area' : 'New Practice Area'}
        description={editingItem ? `Customizing: ${editingItem.title}` : 'Define a new legal service for your firm'}
      >
        <PracticeAreaForm 
          initialData={editingItem} 
          onSuccess={() => { closeModal(); router.refresh(); }} 
          onCancel={closeModal}
        />
      </AdminDialog>
    </div>
  )
}
