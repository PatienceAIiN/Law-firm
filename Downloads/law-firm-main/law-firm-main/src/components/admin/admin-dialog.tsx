'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  onBack?: () => void
  isLoading?: boolean
}

export function AdminDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  onBack,
  isLoading
}: AdminDialogProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-3xl overflow-hidden border-none">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-navy-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <DialogPrimitive.Title className="text-xl font-black text-navy-900 uppercase tracking-tighter">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
            </div>
            <DialogPrimitive.Close className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-navy-900 outline-none">
              <X className="w-6 h-6" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="max-h-[80vh] overflow-y-auto p-8 relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
              </div>
            )}
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
