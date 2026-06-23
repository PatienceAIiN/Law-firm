'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SuperAdminLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/admin/login?signedOut=1' })}
      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
    >
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  )
}
