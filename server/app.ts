import { Elysia } from 'elysia'

const app = new Elysia({ prefix: '/api' })
	.get('/health', () => ({ status: 'ok' }))
	.all('/auth/*', async ({ request }) => {
		const { auth } = await import('@/lib/auth')
		return auth.handler(request)
	})

export type App = typeof app

export default app
