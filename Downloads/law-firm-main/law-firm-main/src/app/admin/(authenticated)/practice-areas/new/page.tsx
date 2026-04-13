import { PracticeAreaForm } from '@/components/admin/practice-area-form'

export default function NewPracticeAreaPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Service</h1>
        <p className="text-gray-500">Add a new legal practice area to your website.</p>
      </div>
      
      <PracticeAreaForm />
    </div>
  )
}
