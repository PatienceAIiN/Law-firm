export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false
  const raw = process.env.SUPER_ADMIN_EMAILS || ''
  const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const fallbackEmail = (process.env.ADMIN_EMAIL || 'admin@lawfirm.com').toLowerCase()
  const target = email.toLowerCase()
  return target === fallbackEmail || list.includes(target)
}
