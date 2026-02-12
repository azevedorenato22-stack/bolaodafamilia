const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared', 'database'],
  // Allow access to dev assets when using Cloudflare tunnel links
  allowedDevOrigins: ['*.trycloudflare.com', '*.devtunnels.ms', '*.brs.devtunnels.ms'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Proxy para a API
  async rewrites() {
    // Pega a URL do backend das variáveis de ambiente ou usa localhost como fallback
    // Remove a barra final se existir para evitar duplicidade
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        // Redireciona /api/... do frontend para a API correta (Render ou Local)
        // Adicionando /api na destination pois o NestJS usa setGlobalPrefix('api')
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
