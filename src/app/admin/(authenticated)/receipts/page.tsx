import { ReceiptsManager } from '@/components/receipts/receipts-manager'

export const dynamic = 'force-dynamic'

export default function AdminReceiptsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#14203E]">Receipts</h1>
        <p className="text-sm text-gray-500 mt-1">Generate, download, email and manage client payment receipts.</p>
      </div>
      <ReceiptsManager />
    </div>
  )
}
