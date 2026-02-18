import { asc, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { tag } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const tagRoutes = new Elysia({ prefix: '/tags' }).use(authPlugin).get(
	'/',
	async ({ user }) => {
		return db
			.select({ id: tag.id, name: tag.name })
			.from(tag)
			.where(eq(tag.userId, user.id))
			.orderBy(asc(tag.name))
	},
	{ auth: true },
)
