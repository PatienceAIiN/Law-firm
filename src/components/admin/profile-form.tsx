'use client'

import { useState } from 'react'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { ImageUpload } from './image-upload'
import { buildGoogleMapsEmbedUrl } from '@/lib/location'

interface ProfileFormProps {
  initialData: any
  action: (formData: FormData) => Promise<void>
}

export function ProfileForm({ initialData, action }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileImage, setProfileImage] = useState(initialData?.profileImage || '')
  const socialLinks = initialData?.socialLinks ? JSON.parse(initialData.socialLinks) : {}
  const officeDetails = initialData?.officeDetails ? JSON.parse(initialData.officeDetails) : {}
  const [officeAddress, setOfficeAddress] = useState(officeDetails.address || '')
  const mapEmbedUrl = buildGoogleMapsEmbedUrl(officeAddress)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to save these profile changes?')) {
      return
    }
    setLoading(true)
    setSaved(false)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('profileImage', profileImage)
      await action(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-full space-y-4">
           <input type="hidden" name="profileImage" value={profileImage} />
           <ImageUpload 
             label="Profile Photo"
             value={profileImage}
             onChange={setProfileImage}
           />
        </div>

        <div className="col-span-full border-b border-gray-100 pb-4 mb-2">
          <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Full Name</label>
          <input
            name="name"
            defaultValue={initialData?.name}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Professional Title</label>
          <input
            name="title"
            defaultValue={initialData?.title}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="col-span-full space-y-2">
          <label className="text-sm font-semibold text-gray-700">Biography / About Content</label>
          <textarea
            name="aboutContent"
            defaultValue={initialData?.aboutContent}
            rows={6}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="col-span-full border-b border-gray-100 pb-4 mb-2 mt-4">
          <h2 className="text-lg font-bold text-gray-900">Office & Contact Details</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Contact Email</label>
          <input
            name="email"
            defaultValue={officeDetails.email}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Phone Number</label>
          <input
            name="phone"
            defaultValue={officeDetails.phone}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="col-span-full space-y-2">
          <label className="text-sm font-semibold text-gray-700">Office Address</label>
          <input
            name="address"
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        {mapEmbedUrl && (
          <div className="col-span-full space-y-2">
            <label className="text-sm font-semibold text-gray-700">Google Map Preview</label>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <iframe
                src={mapEmbedUrl}
                title="Office map preview"
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}

        <div className="col-span-full border-b border-gray-100 pb-4 mb-2 mt-4">
          <h2 className="text-lg font-bold text-gray-900">Social Media</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">LinkedIn URL</label>
          <input
            name="linkedin"
            defaultValue={socialLinks.linkedin}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Twitter URL</label>
          <input
            name="twitter"
            defaultValue={socialLinks.twitter}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`flex items-center px-8 py-3 font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 ${saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-5 h-5 mr-2" />
        ) : (
          <Save className="w-5 h-5 mr-2" />
        )}
        {loading ? 'Saving Changes...' : saved ? 'Saved!' : 'Save Profile Changes'}
      </button>
    </form>
  )
}
