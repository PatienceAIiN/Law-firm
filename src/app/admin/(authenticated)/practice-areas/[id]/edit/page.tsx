import { PracticeAreaForm } from '@/components/admin/practice-area-form'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditPracticeAreaPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const area = await prisma.practiceArea.findUnique({
    where: { id }
  })

  if (!area) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
        <p className="text-gray-500">Update the details for "{area.title}".</p>
      </div>
      
      <PracticeAreaForm initialData={area} />
    </div>
  )
}
