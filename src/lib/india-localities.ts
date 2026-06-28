// Live locality lookup against India Post's open PostalPinCode API.
// https://api.postalpincode.in/postoffice/<city or area name>
// Returns every post office in that area — names map well to localities
// / suburbs that users actually search by.

export type Locality = { name: string; pincode: string; district?: string; state?: string }

const cache = new Map<string, Locality[]>()

export async function fetchLocalities(query: string): Promise<Locality[]> {
  const q = (query || '').trim()
  if (q.length < 2) return []
  if (cache.has(q.toLowerCase())) return cache.get(q.toLowerCase())!
  try {
    const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(q)}`)
    if (!res.ok) return []
    const data = await res.json()
    const block = Array.isArray(data) ? data[0] : null
    if (!block || block.Status !== 'Success' || !Array.isArray(block.PostOffice)) return []
    const seen = new Set<string>()
    const out: Locality[] = []
    for (const po of block.PostOffice) {
      const key = (po.Name || '').toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push({
        name: po.Name,
        pincode: po.Pincode || '',
        district: po.District || undefined,
        state: po.State || undefined,
      })
    }
    cache.set(q.toLowerCase(), out)
    return out
  } catch {
    return []
  }
}
