import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Portal | Law Firm',
  description: 'Manage your law firm website content',
}

export const dynamic = 'force-dynamic'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
