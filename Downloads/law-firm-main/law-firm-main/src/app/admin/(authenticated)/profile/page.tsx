import { prisma } from '@/lib/prisma'
import { updateProfile } from './actions'
import { ProfileForm } from '@/components/admin/profile-form'

export default async function ProfilePage() {
  const profile = await prisma.aboutProfile.findUnique({
    where: { id: 'default-profile' }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">About Profile</h1>
        <p className="text-gray-500">Manage the personal and office details shown on the website.</p>
      </div>

      <ProfileForm initialData={profile} action={updateProfile} />
    </div>
  )
}
