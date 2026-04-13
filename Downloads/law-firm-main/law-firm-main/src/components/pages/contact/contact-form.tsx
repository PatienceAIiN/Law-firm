'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { submitContact } from '@/app/(marketing)/contact/actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

export function ContactForm({ content }: { content?: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const section = content?.contact?.form || {}

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await submitContact(formData)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-gradient-to-b from-white via-slate-50 to-white p-12 text-center shadow-xl animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-3xl font-black text-[#0a192f] mb-4 uppercase tracking-tighter">{section.successTitle || 'MESSAGE RECEIVED'}</h3>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed mb-10">
          {section.successMessage || 'Thank you for reaching out. A senior associate will review your inquiry and contact you within 24 hours.'}
        </p>
        <Button 
          onClick={() => setIsSubmitted(false)}
          className="bg-[#0a192f] hover:bg-[#c5a059] text-white px-8 py-6 rounded-2xl font-bold transition-all"
        >
          {section.resetText || 'Send Another Inquiry'}
        </Button>
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-gray-100 bg-gradient-to-b from-white via-slate-50 to-white p-10 shadow-2xl">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#c5a059]/5 -mr-16 -mt-16"></div>
      
      <h2 className="text-3xl font-black text-[#0a192f] mb-8 uppercase tracking-tighter">{section.title || 'LEGAL INQUIRY FORM'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              {section.fullNameLabel || 'FULL NAME *'}
            </label>
            <input
              name="fullName"
              required
              className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:bg-white outline-none transition-all font-medium"
              placeholder={section.fullNamePlaceholder || 'Case lead name'}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              {section.emailLabel || 'EMAIL ADDRESS *'}
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:bg-white outline-none transition-all font-medium"
              placeholder={section.emailPlaceholder || 'e.g. counsel@example.com'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              {section.phoneLabel || 'PHONE NUMBER'}
            </label>
            <input
              type="tel"
              name="phone"
              className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:bg-white outline-none transition-all font-medium"
              placeholder={section.phonePlaceholder || '+91 00000 00000'}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              {section.subjectLabel || 'INQUIRY TYPE *'}
            </label>
            <select
              name="subject"
              required
              className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:bg-white outline-none transition-all font-medium"
            >
              <option value="">{section.subjectPlaceholder || 'Select Category'}</option>
              {(section.subjectOptions || [
                { value: 'corporate', label: 'Corporate Compliance' },
                { value: 'criminal', label: 'Criminal Defense' },
                { value: 'family', label: 'Family/Matrimonial' },
                { value: 'property', label: 'Property Dispute' },
                { value: 'other', label: 'General Inquiry' }
              ]).map((option: any) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
            {section.messageLabel || 'CASE BRIEF / MESSAGE *'}
          </label>
          <textarea
            name="message"
            required
            rows={5}
            className="w-full px-5 py-4 bg-[#f8fafc] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a059] focus:bg-white outline-none transition-all font-medium resize-none"
            placeholder={section.messagePlaceholder || 'Describe your legal situation briefly...'}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-16 bg-[#0a192f] hover:bg-[#c5a059] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            section.submitText || 'SUBMIT INQUIRY'
          )}
        </Button>
      </form>
    </div>
  )
}
