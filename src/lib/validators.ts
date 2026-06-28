// Tiny, dependency-free validators used by client forms.

export function isValidEmail(value: string): boolean {
  if (!value) return false
  // Pragmatic — not RFC-perfect, but rejects the 95% of malformed input.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

// Indian mobile by default. Accepts optional +91 / 0 prefix and 10 digits
// starting with 6-9. Strips spaces / hyphens before checking.
export function isValidPhone(value: string): boolean {
  if (!value) return false
  const cleaned = value.replace(/[\s\-()]/g, '')
  return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned)
}

export function emailHint(value: string): string {
  if (!value) return ''
  return isValidEmail(value) ? '' : 'Enter a valid email like name@example.com'
}

export function phoneHint(value: string): string {
  if (!value) return ''
  return isValidPhone(value) ? '' : 'Enter a valid 10-digit Indian mobile number'
}
