/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'yourdomain.com'],
    },
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'uploadthing.com'],
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
  async redirects() {
    return [
      { source: '/about', destination: '/', permanent: false },
      { source: '/contact', destination: '/', permanent: false },
      { source: '/consultation', destination: '/', permanent: false },
      { source: '/blog', destination: '/', permanent: false },
      { source: '/blog/:slug*', destination: '/', permanent: false },
      { source: '/practice-areas', destination: '/', permanent: false },
      { source: '/practice-areas/:slug*', destination: '/', permanent: false },
      { source: '/testimonial-request/:rest*', destination: '/', permanent: false },
      { source: '/lawyer', destination: '/', permanent: false },
      { source: '/lawyer/:rest*', destination: '/', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy — send origin only to external sites
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — restrict sensitive browser APIs
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
          // HSTS — force HTTPS for 1 year, include subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Content Security Policy — allow self, inline styles/scripts (Next.js needs them), and trusted external sources
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.pexels.com https://*.supabase.co",
              "media-src 'self' blob: https://videos.pexels.com https://*.pexels.com",
              "connect-src 'self' https://*.supabase.com https://*.supabase.co wss://*.livekit.cloud https://*.livekit.cloud https://res.cloudinary.com https://api.cloudinary.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

