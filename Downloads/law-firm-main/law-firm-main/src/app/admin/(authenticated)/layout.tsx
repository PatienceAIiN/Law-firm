import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminPageRouteLoader } from '@/components/admin/route-loader'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminPageRouteLoader />
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="text-sm font-medium text-gray-500">
            Welcome back, <span className="text-gray-900">{session.user?.name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase">
              {session.user?.name?.substring(0, 2)}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
