import { redirect as nextRedirect } from 'next/navigation'

export default function AdminIndexPage() {
  nextRedirect('/admin/dashboard')
}
