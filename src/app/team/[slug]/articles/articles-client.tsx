'use client'

import { useState } from 'react'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { BlogModal } from '@/components/blog-modal'
import type { BlogPost } from '@prisma/client'

export function TenantArticlesClient({ articles }: { articles: BlogPost[] }) {
  const [activePost, setActivePost] = useState<BlogPost | null>(null)

  if (articles.length === 0) {
    return <p className="mt-10 text-sm text-slate-500">No articles published yet.</p>
  }

  return (
    <>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((post) => (
          <article
            key={post.id}
            onClick={() => setActivePost(post)}
            className="card-3d bg-white rounded-[2rem] border border-gray-100 overflow-hidden group flex flex-col h-full cursor-pointer shadow-sm dark:bg-[#11151f] dark:border-white/10"
          >
            <div className="aspect-[16/10] bg-primary/5 relative overflow-hidden flex-shrink-0">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#14203E] to-[#112240]">
                  <Clock className="w-12 h-12 text-primary opacity-20" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-[#F6F0E8] text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Firm Update
                </span>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400 mb-4 dark:text-slate-400">
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-primary dark:text-secondary" />
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}</span>
                </div>
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-primary dark:text-secondary" />
                  <span>{Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200))} MIN READ</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-primary mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight dark:text-white">
                {post.title}
              </h3>

              <p className="text-gray-500 mb-8 flex-1 line-clamp-3 leading-relaxed text-sm dark:text-slate-300">
                {post.excerpt}
              </p>

              <div className="inline-flex items-center text-primary font-bold text-sm tracking-tight border-b-2 border-[#F4E8D8] pb-1 self-start group-hover:border-primary transition-all mt-auto dark:text-secondary dark:border-secondary/30 dark:group-hover:border-secondary">
                READ ARTICLE
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <BlogModal post={activePost} onClose={() => setActivePost(null)} />
    </>
  )
}
