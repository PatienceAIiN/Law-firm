import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PracticeAreaManager } from '@/components/admin/practice-area-manager'
import { Suspense } from 'react'

async function deleteAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  await (prisma as any).practiceArea?.delete({ where: { id } })
  revalidatePath('/admin/practice-areas')
  revalidatePath('/')
}

export default async function PracticeAreasPage() {
  const practiceAreas = await (prisma as any).practiceArea?.findMany({
    orderBy: { order: 'asc' }
  }) || []

  return (
    <div className="p-8 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-5xl font-black text-navy-900 uppercase tracking-tighter">Practice Areas</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Manage the legal services and specific expertise of your firm.</p>
        </div>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Manager...</div>}>
        <PracticeAreaManager initialData={practiceAreas} deleteAction={deleteAction} />
      </Suspense>
    </div>
  )
}
