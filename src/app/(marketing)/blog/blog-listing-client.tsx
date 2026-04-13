'use client'

import { useState } from 'react'
import { ArrowRight, Calendar, Clock, Search } from 'lucide-react'
import { BlogModal } from '@/components/blog-modal'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  coverImage?: string | null
  publishedAt?: Date | string | null
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'DRAFT'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function BlogListingClient({ posts }: { posts: BlogPost[] }) {
  const [activePost, setActivePost] = useState<BlogPost | null>(null)

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f] text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl lg:text-7xl font-black leading-none uppercase tracking-tighter">
            LEGAL <span className="text-[#c5a059]">INSIGHTS</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Expert analysis on the latest legal transitions and corporate laws in India.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group flex flex-col h-full cursor-pointer"
                onClick={() => setActivePost(post)}
              >
                {/* Cover image */}
                <div className="aspect-[16/10] bg-[#0a192f]/5 relative overflow-hidden flex-shrink-0">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a192f] to-[#112240]">
                      <div className="text-[#c5a059] font-black text-4xl opacity-20">AW</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#0a192f]/0 group-hover:bg-[#0a192f]/10 transition-colors duration-300" />
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                      5 Min Read
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-[#0a192f] mb-3 group-hover:text-[#c5a059] transition-colors line-clamp-2 leading-tight uppercase tracking-tight">
                    {post.title}
                  </h2>

                  <p className="text-gray-500 mb-6 flex-1 line-clamp-3 leading-relaxed font-medium text-sm">
                    {post.excerpt}
                  </p>

                  <div className="inline-flex items-center text-[#0a192f] font-black text-[10px] tracking-[0.2em] group-hover:text-[#c5a059] transition-all uppercase mt-auto">
                    READ FULL CASE
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </article>
            ))}

            {posts.length === 0 && (
              <div className="col-span-full py-32 text-center text-gray-400 space-y-4">
                <Search className="w-12 h-12 mx-auto opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm">No insights published yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog modal */}
      <BlogModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
