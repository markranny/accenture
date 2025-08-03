/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mysql2']
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
}

module.exports = nextConfig