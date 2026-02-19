import { mock } from 'bun:test'

// Set test environment variables before anything else
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-chars-long'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.GITHUB_CLIENT_ID = 'test'
process.env.GITHUB_CLIENT_SECRET = 'test'
process.env.GOOGLE_CLIENT_ID = 'test'
process.env.GOOGLE_CLIENT_SECRET = 'test'

// Mock @/lib/db — must come before any route import
mock.module('@/lib/db', () => {
	const { mockDb } = require('./helpers/mock-db')
	return { db: mockDb }
})

// Mock @/lib/auth
mock.module('@/lib/auth', () => {
	const { mockAuth } = require('./helpers/mock-auth')
	return { auth: mockAuth }
})

// Mock @vercel/blob
mock.module('@vercel/blob', () => ({
	put: async (_path: string, _file: unknown, _opts: unknown) => ({
		url: 'https://example.public.blob.vercel-storage.com/avatar.jpg',
		downloadUrl: 'https://example.public.blob.vercel-storage.com/avatar.jpg',
		pathname: 'avatars/test/test-user-id.jpg',
	}),
	del: async () => {},
}))
