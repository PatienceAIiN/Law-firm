/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'yourdomain.com'],
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
};

module.exports = nextConfig;
