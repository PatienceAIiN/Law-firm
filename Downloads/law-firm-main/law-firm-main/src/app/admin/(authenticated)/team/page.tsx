import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import { TeamManager } from '@/components/admin/team-manager'
import { createTeamMember, updateTeamMember, deleteTeamMember } from './actions'

export default async function TeamPage() {
  const members = await (prisma as any).teamMember.findMany({
    orderBy: { order: 'asc' },
  }) || []

  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-3xl lg:text-5xl font-black text-navy-900 uppercase tracking-tighter">Legal Team</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
          Manage advocate profiles and team details — synced with the About page.
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Team...</div>}>
        <TeamManager
          initialData={members}
          createAction={createTeamMember}
          updateAction={updateTeamMember}
          deleteAction={deleteTeamMember}
        />
      </Suspense>
    </div>
  )
}
