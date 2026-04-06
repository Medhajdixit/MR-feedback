/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        NEXT_PUBLIC_SHARDEUM_RPC: process.env.NEXT_PUBLIC_SHARDEUM_RPC || 'https://api-unstable.shardeum.org',
        NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8080',
        NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs'
    },
    images: {
        domains: ['ipfs.io', 'gateway.pinata.cloud'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig
