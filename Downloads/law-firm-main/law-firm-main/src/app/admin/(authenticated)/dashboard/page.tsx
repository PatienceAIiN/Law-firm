import { Metadata } from 'next'
import { DashboardOverview } from '@/components/admin/dashboard-overview'
import { RecentActivity } from '@/components/admin/recent-activity'
import { QuickActions } from '@/components/admin/quick-actions'

export const metadata: Metadata = {
  title: 'Dashboard | Admin Panel',
  description: 'Law firm admin dashboard for managing content, bookings, and inquiries',
}

export default async function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-5xl font-black text-[#0a192f] uppercase tracking-tighter">DASHBOARD</h1>
          <p className="mt-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Real-time metrics and management node</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DashboardOverview />
            <RecentActivity />
          </div>
          
          <div className="space-y-8">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
