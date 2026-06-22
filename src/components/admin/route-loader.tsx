'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function AdminPageRouteLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== lastPath) {
      setLoading(true)
      const timer = setTimeout(() => {
        setLoading(false)
        setLastPath(pathname)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [pathname, lastPath])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-blue-600 origin-left"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full h-full bg-blue-400"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
