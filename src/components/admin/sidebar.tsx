'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  User,
  Settings,
  Inbox,
  Star,
  ChevronRight,
  Loader2,
  CalendarDays,
  MonitorPlay,
  MessageSquareText,
  Mail,
  Layers3,
  Users,
  Scale,
  ReceiptText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { AdminDialog } from './admin-dialog'
import { AlertTriangle, LogOut as LogOutIcon } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Home Page', href: '/admin/home-content', icon: Layers3 },
  { name: 'Case Management', href: '/admin/cases', icon: Scale },
  { name: 'Blogs', href: '/admin/blogs', icon: FileText },
  { name: 'Practice Areas', href: '/admin/practice-areas', icon: Briefcase },
  { name: 'Availability', href: '/admin/availability', icon: CalendarDays },
  { name: 'Virtual Meetings', href: '/admin/virtual-meetings', icon: MonitorPlay },
  { name: 'Receipts', href: '/admin/receipts', icon: ReceiptText },
  { name: 'AI Chats', href: '/admin/ai-chats', icon: MessageSquareText },
  { name: 'Mail', href: '/admin/mail', icon: Mail },
  { name: 'Pages', href: '/admin/pages', icon: Layers3 },
  { name: 'Legal Team', href: '/admin/team', icon: Users },
  { name: 'Success Stories', href: '/admin/testimonials', icon: Star },
  { name: 'About Profile', href: '/admin/profile', icon: User },
  { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 bg-gray-50/50">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
          Admin Portal
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-300 group',
                  isActive
                    ? 'bg-navy-900 text-white shadow-xl shadow-navy-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-primary'
                )}
            >
              <div className="flex items-center">
                <item.icon
                  className={cn(
                    'mr-3 h-4 w-4 transition-colors',
                    isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => setShowConfirm(true)}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors group disabled:opacity-50"
        >
          {isSigningOut ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <LogOutIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-600" />
          )}
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>

      <AdminDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Sign Out"
        description="Are you sure you want to end your session?"
        isLoading={isSigningOut}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-gray-500 font-medium">You will need to re-authenticate to access the administrative dashboard.</p>
          <div className="grid grid-cols-2 gap-4 w-full">
             <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="py-4 rounded-2xl border border-gray-100 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-50 bg-white"
             >
               Keep Session
             </button>
             <button
              type="button"
              onClick={handleSignOut}
              className="py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-700 shadow-xl shadow-red-600/20"
             >
               Sign Out Now
             </button>
          </div>
        </div>
      </AdminDialog>
    </div>
  )
}
