/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true';
    const backendUrl = isDocker ? 'http://backend:8080' : 'http://localhost:8080';
   return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
      // Add image proxy
      {
        source: '/avatars/:path*',
        destination: `${backendUrl}/avatars/:path*`,
      },
      {
        source: '/avatars2/:path*',
        destination: `${backendUrl}/avatars2/:path*`,
      },
      // Add group uploads proxy
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend', // Add backend service name
        port: '8080',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;