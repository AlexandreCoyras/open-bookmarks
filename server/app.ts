import { Elysia } from 'elysia'
import { authPlugin } from '@/server/auth-middleware'
import { bookmarkRoutes } from '@/server/routes/bookmarks'
import { folderRoutes } from '@/server/routes/folders'
import { importRoutes } from '@/server/routes/import'
import { publicRoutes } from '@/server/routes/public'

const app = new Elysia({ prefix: '/api' })
	.use(publicRoutes)
	.use(authPlugin)
	.use(bookmarkRoutes)
	.use(folderRoutes)
	.use(importRoutes)
	.get('/health', () => ({ status: 'ok' }))

export type App = typeof app

export default app
