/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8080/:path*', 
      },
      // Add image proxy for Docker
      {
        source: '/avatars/:path*',
        destination: 'http://backend:8080/avatars/:path*',
      },
      {
        source: '/avatars2/:path*',
        destination: 'http://backend:8080/avatars2/:path*',
      },
  

       {
        source: '/uploads/:path*',
        destination: 'http://backend:8080/uploads/:path*',
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