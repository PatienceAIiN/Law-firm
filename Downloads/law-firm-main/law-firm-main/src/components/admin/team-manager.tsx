'use client'

import { useState } from 'react'
import { Plus, Edit, Search, Users, Mail, Phone, Linkedin, Eye, EyeOff } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AdminDialog } from './admin-dialog'
import { TeamForm } from './team-form'
import { DeleteButton } from './delete-button'
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

interface TeamManagerProps {
  initialData: TeamMember[]
  createAction: (formData: FormData) => Promise<void>
  updateAction: (id: string, formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

export function TeamManager({ initialData, createAction, updateAction, deleteAction }: TeamManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState('')

  const modalType = searchParams.get('modal')
  const editingId = searchParams.get('id')
  const isModalOpen = modalType === 'team'
  const editingItem = editingId ? data.find((item) => item.id === editingId) || null : null

  const openModal = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'team')
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

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async (formData: FormData) => {
    if (editingItem) {
      await updateAction(editingItem.id, formData)
    } else {
      await createAction(formData)
    }
    closeModal()
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-navy-900/5 transition-all text-sm font-medium shadow-sm"
          />
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center px-6 py-3 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-navy-900/20 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Advocate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((member) => (
          <div
            key={member.id}
            className="card-3d bg-white rounded-[2rem] border border-gray-100 overflow-hidden group relative"
          >
            {/* Header with image */}
            <div className="bg-gradient-to-br from-[#0a192f] to-[#1e3a5f] p-6 text-center relative">
              <div className="relative w-20 h-20 mx-auto mb-3">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="rounded-full object-cover border-2 border-[#c5a059]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#c5a059]/20 border-2 border-[#c5a059] flex items-center justify-center">
                    <span className="text-[#c5a059] text-xl font-black">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-white font-black text-sm uppercase tracking-tight">{member.name}</h3>
              <p className="text-[#c5a059] text-[10px] font-bold uppercase tracking-widest mt-1">{member.title}</p>

              {/* Action buttons — visible on hover */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openModal(member.id)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <DeleteButton
                  id={member.id}
                  action={deleteAction}
                  className="p-2 bg-white/10 hover:bg-red-500/30 rounded-xl text-white transition-all"
                />
              </div>

              {!member.isActive && (
                <div className="absolute top-3 left-3">
                  <span className="flex items-center gap-1 bg-red-500/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                    <EyeOff className="w-2.5 h-2.5" /> Hidden
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">{member.bio}</p>

              {member.expertise && (
                <div className="text-[10px] text-gray-500">
                  <span className="font-black text-navy-900 uppercase tracking-widest">Expertise: </span>
                  {member.expertise}
                </div>
              )}

              {member.education && (
                <div className="text-[10px] text-gray-500">
                  <span className="font-black text-navy-900 uppercase tracking-widest">Education: </span>
                  {member.education}
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                {member.email && (
                  <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-[#c5a059] transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="text-slate-400 hover:text-[#c5a059] transition-colors">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#c5a059] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-gray-300">
                  #{member.order}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4">
            <Users className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">No team members found</p>
            <button
              onClick={() => openModal()}
              className="mt-2 px-5 py-2.5 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
            >
              Add First Member
            </button>
          </div>
        )}
      </div>

      <AdminDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Team Member' : 'Add Advocate'}
        description={editingItem ? `Updating: ${editingItem.name}` : 'Add a new advocate to your legal team'}
      >
        <TeamForm
          initialData={editingItem}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </AdminDialog>
    </div>
  )
}
