'use client'

// Live video cover background (Pexels, no humans). Sits behind hero content
// with a theme-aware overlay so text stays legible in light and dark mode.
// A light gradient poster paints instantly so the page never flashes blank
// while the mp4 loads; the video fades in over the top once it can play.
import { useState } from 'react'

const POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='%23FFFCF8'/>
        <stop offset='55%' stop-color='%23F8F0E1'/>
        <stop offset='100%' stop-color='%23EFE3CC'/>
      </linearGradient></defs>
      <rect width='16' height='9' fill='url(%23g)'/>
    </svg>`
  )

const isImage = (url: string) => /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(url)

export function VideoCover({ src, overlay = 'medium' }: { src: string; overlay?: 'light' | 'medium' | 'strong' }) {
  const overlayClass =
    overlay === 'strong'
      ? 'bg-[#FFFCF8]/82 dark:bg-[#0b0f17]/82'
      : overlay === 'light'
        ? 'bg-[#FFFCF8]/60 dark:bg-[#0b0f17]/62'
        : 'bg-[#FFFCF8]/72 dark:bg-[#0b0f17]/74'

  const [ready, setReady] = useState(false)
  const usingImage = isImage(src)

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${POSTER}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {usingImage ? (
        <img
          src={src}
          alt=""
          className={`h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setReady(true)}
        />
      ) : (
        <video
          className={`h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={POSTER}
          onCanPlay={() => setReady(true)}
          onLoadedData={() => setReady(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      <div className={`absolute inset-0 ${overlayClass}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FFFCF8] dark:to-[#0b0f17]" />
    </div>
  )
}

// Central registry so every page picks a distinct, human-free clip.
// Light/airy backgrounds with low motion so the page feels calm.
export const COVER_VIDEOS = {
  home: 'https://videos.pexels.com/video-files/5561389/5561389-hd_1920_1080_25fps.mp4',
  consultation: 'https://videos.pexels.com/video-files/34645258/14683978_2560_1440_30fps.mp4',
  articles: 'https://videos.pexels.com/video-files/856171/856171-hd_1920_1080_30fps.mp4',
  contact: 'https://videos.pexels.com/video-files/1093652/1093652-hd_1920_1080_30fps.mp4',
  about: 'https://videos.pexels.com/video-files/6772135/6772135-hd_1920_1080_30fps.mp4',
}
