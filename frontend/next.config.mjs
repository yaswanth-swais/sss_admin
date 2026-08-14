/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/admin",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.image2url.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add trailing slash to handle routing properly
  trailingSlash: true,
};

export default nextConfig;
