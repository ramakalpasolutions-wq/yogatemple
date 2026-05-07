// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'res.cloudinary.com',
      'www.gstatic.com',
      'lh3.googleusercontent.com',
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;