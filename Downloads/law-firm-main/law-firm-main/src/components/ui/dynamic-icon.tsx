'use client'

import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface DynamicIconProps {
  name?: string | null
  className?: string
  fallback?: LucideIcon
}

export function DynamicIcon({ name, className, fallback: Fallback }: DynamicIconProps) {
  if (!name) return Fallback ? <Fallback className={className} /> : null

  const IconComponent = (Icons as any)[name] as LucideIcon

  if (!IconComponent) {
    return Fallback ? <Fallback className={className} /> : null
  }

  return <IconComponent className={className} />
}
