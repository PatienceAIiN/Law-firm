'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Calendar, Clock, Share2, Check, ArrowLeft, Scale } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  coverImage?: string | null
  publishedAt?: Date | string | null
}

interface BlogModalProps {
  post: BlogPost | null
  onClose: () => void
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function BlogModal({ post, onClose }: BlogModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (post) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [post, onClose])

  useEffect(() => {
    if (post) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [post])

  if (!post) return null

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${post.slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt || post.title, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto my-8 px-4 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Article */}
        <article className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Cover image - small */}
          {post.coverImage && (
            <div className="aspect-[21/8] overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!post.coverImage && (
            <div className="aspect-[21/6] bg-gradient-to-br from-[#14203E] to-[#112240] flex items-center justify-center">
              <Scale className="h-16 w-16 text-primary opacity-20" />
            </div>
          )}

          <div className="p-8 sm:p-12">
            {/* Meta */}
            <div className="flex items-center gap-5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {formatDate(post.publishedAt)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200))} Min Read
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-primary uppercase tracking-tighter leading-tight mb-6">
              {post.title}
            </h1>

            {/* Content */}
            <div
              className="prose prose-sm sm:prose-base prose-navy max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-gray-600 prose-strong:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-primary font-black text-sm">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-primary uppercase tracking-wider">Advocate</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Editorial Team</div>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-full text-primary font-bold text-xs hover:bg-[#F6F0E8] hover:text-white hover:border-[#F4E8D8] transition-all"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-500" /> Link Copied!</>
                ) : (
                  <><Share2 className="w-4 h-4" /> Share Insight</>
                )}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
