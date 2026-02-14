import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	serverExternalPackages: ['elysia', '@elysiajs/eden', 'esbuild-wasm'],
	turbopack: {},
}

export default nextConfig
