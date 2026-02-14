import withSerwist from '@serwist/next'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	serverExternalPackages: ['elysia', '@elysiajs/eden'],
	turbopack: {},
}

export default withSerwist({
	swSrc: 'app/sw.ts',
	swDest: 'public/sw.js',
	disable: process.env.NODE_ENV !== 'production',
})(nextConfig)
