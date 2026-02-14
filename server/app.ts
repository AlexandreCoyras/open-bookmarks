import { Elysia } from 'elysia'
import { authPlugin } from '@/server/auth-middleware'
import { bookmarkRoutes } from '@/server/routes/bookmarks'
import { folderRoutes } from '@/server/routes/folders'

const app = new Elysia({ prefix: '/api' })
	.use(authPlugin)
	.use(bookmarkRoutes)
	.use(folderRoutes)
	.get('/health', () => ({ status: 'ok' }))

export type App = typeof app

export default app
