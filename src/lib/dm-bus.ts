// Tiny in-process pub/sub for direct-message events. SSE clients
// subscribe to a threadId; POST /api/dm publishes after a successful
// insert. Replaces 1.5s polling with sub-100ms push.
//
// Single Node process scope — multi-instance deploys would need Redis
// pub/sub here. Falls back to the existing 4s polling on the client
// when the stream isn't connected.

type Listener = (data: string) => void
const channels = new Map<string, Set<Listener>>()

export function subscribe(threadId: string, fn: Listener): () => void {
  let set = channels.get(threadId)
  if (!set) { set = new Set(); channels.set(threadId, set) }
  set.add(fn)
  return () => {
    set?.delete(fn)
    if (set && set.size === 0) channels.delete(threadId)
  }
}

export function publish(threadId: string, payload: unknown) {
  const set = channels.get(threadId)
  if (!set) return
  const data = JSON.stringify(payload)
  set.forEach((fn) => { try { fn(data) } catch {} })
}
