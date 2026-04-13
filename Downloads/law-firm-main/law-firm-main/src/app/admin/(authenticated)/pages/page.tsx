import { Metadata } from 'next'
import { getSitePages } from '@/lib/site-pages'
import { PageManager } from '@/components/admin/page-manager'

export const metadata: Metadata = {
  title: 'Pages | Admin Panel',
  description: 'Create and manage custom pages, navbar links, and footer policy pages',
}

export default async function AdminPagesPage() {
  const pages = await getSitePages()

  return (
    <div className="p-8">
      <PageManager initialPages={pages} />
    </div>
  )
}
