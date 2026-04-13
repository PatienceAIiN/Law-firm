export function buildGoogleMapsEmbedUrl(address?: string | null) {
  const query = address?.trim()
  if (!query) return ''
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

export function buildGoogleMapsSearchUrl(address?: string | null) {
  const query = address?.trim()
  if (!query) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
