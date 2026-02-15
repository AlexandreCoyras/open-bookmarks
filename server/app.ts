import { Elysia } from 'elysia'
import { authPlugin } from '@/server/auth-middleware'
import { bookmarkRoutes } from '@/server/routes/bookmarks'
import { collaboratorRoutes } from '@/server/routes/collaborators'
import { exportRoutes } from '@/server/routes/export'
import { folderRoutes } from '@/server/routes/folders'
import { importRoutes } from '@/server/routes/import'
import { publicRoutes } from '@/server/routes/public'
import { searchRoutes } from '@/server/routes/search'

const app = new Elysia({ prefix: '/api' })
	.use(publicRoutes)
	.use(authPlugin)
	.use(bookmarkRoutes)
	.use(folderRoutes)
	.use(collaboratorRoutes)
	.use(importRoutes)
	.use(exportRoutes)
	.use(searchRoutes)
	.get('/health', () => ({ status: 'ok' }))

export type App = typeof app

export default app
