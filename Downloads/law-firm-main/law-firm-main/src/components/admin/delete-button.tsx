'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeleteButtonProps {
  id: string
  action: (formData: FormData) => Promise<void>
  className?: string
}

export function DeleteButton({ id, action, className }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      e.preventDefault()
      return
    }
    setIsDeleting(true)
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="id" value={id} />
      <button 
        type="submit"
        disabled={isDeleting}
        className={cn(
          "p-1.5 transition-all rounded-md disabled:opacity-50",
          isDeleting ? "text-gray-300" : "text-gray-400 hover:text-red-600 hover:bg-red-50",
          className
        )}
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </form>
  )
}
