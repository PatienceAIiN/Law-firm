/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'yourdomain.com'],
    },
  },
  outputFileTracingExcludes: {
    '*': [
      './.next/cache/**',
      './node-portable.zip',
      './node-v20.12.2-win-x64/**',
      './scratch/**',
    ],
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
};

module.exports = nextConfig;
