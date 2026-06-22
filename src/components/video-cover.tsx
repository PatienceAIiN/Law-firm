// Live video cover background (Pexels, no humans). Sits behind hero content
// with a theme-aware overlay so text stays legible in light and dark mode.
export function VideoCover({ src, overlay = 'medium' }: { src: string; overlay?: 'light' | 'medium' | 'strong' }) {
  const overlayClass =
    overlay === 'strong'
      ? 'bg-[#FFFCF8]/82 dark:bg-[#0b0f17]/82'
      : overlay === 'light'
        ? 'bg-[#FFFCF8]/60 dark:bg-[#0b0f17]/62'
        : 'bg-[#FFFCF8]/72 dark:bg-[#0b0f17]/74'

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <video
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
      </video>
      {/* Theme overlay for legibility + subtle gradient depth */}
      <div className={`absolute inset-0 ${overlayClass}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FFFCF8] dark:to-[#0b0f17]" />
    </div>
  )
}

// Central registry so every page picks a distinct, human-free clip.
export const COVER_VIDEOS = {
  home: 'https://videos.pexels.com/video-files/5561389/5561389-hd_1920_1080_25fps.mp4',
  consultation: 'https://videos.pexels.com/video-files/34645258/14683978_2560_1440_30fps.mp4',
  articles: 'https://videos.pexels.com/video-files/856171/856171-hd_1920_1080_30fps.mp4',
  contact: 'https://videos.pexels.com/video-files/1093652/1093652-hd_1920_1080_30fps.mp4',
  about: 'https://videos.pexels.com/video-files/6772135/6772135-hd_1920_1080_30fps.mp4',
}
