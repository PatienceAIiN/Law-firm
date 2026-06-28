'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { confirmDialog } from './confirm-dialog'

type Props = {
  onDelete: () => Promise<void | { ok: boolean; error?: string }>
  confirmMessage?: string
  className?: string
  title?: string
}

// Single reusable delete button: shows a spinner while the server action
// runs, alerts on a returned {ok:false,error} or thrown error, and refreshes
// the route on success so the row vanishes without a hard reload.
export function DeleteButton({
  onDelete,
  confirmMessage,
  className = 'rounded-md p-1 text-rose-500 hover:bg-rose-50',
  title = 'Delete',
}: Props) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const handle = async () => {
    if (confirmMessage && !(await confirmDialog({ title: 'Delete?', message: confirmMessage, confirmLabel: 'Delete', tone: 'danger' }))) return
    start(async () => {
      try {
        const res = await onDelete()
        if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
          alert(res.error || 'Delete failed')
          return
        }
        router.refresh()
      } catch (e: any) {
        alert(e?.message || 'Delete failed')
      }
    })
  }
  return (
    <button type="button" onClick={handle} disabled={pending} title={title} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  )
}
