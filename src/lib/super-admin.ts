export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false
  const raw = process.env.SUPER_ADMIN_EMAILS || ''
  const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.toLowerCase())
}
