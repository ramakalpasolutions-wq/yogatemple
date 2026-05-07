// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "res.cloudinary.com",
      "www.gstatic.com",
      "lh3.googleusercontent.com",
    ],
  },

  serverExternalPackages: ["mongoose"],

  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;