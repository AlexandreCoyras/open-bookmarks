import { asc, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { bookmark, folder } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const syncRoutes = new Elysia({ prefix: '/sync' }).use(authPlugin).get(
	'/snapshot',
	async ({ user }) => {
		const [allFolders, allBookmarks] = await Promise.all([
			db
				.select()
				.from(folder)
				.where(eq(folder.userId, user.id))
				.orderBy(asc(folder.position)),
			db
				.select()
				.from(bookmark)
				.where(eq(bookmark.userId, user.id))
				.orderBy(asc(bookmark.position)),
		])

		return {
			folders: allFolders,
			bookmarks: allBookmarks,
			serverTime: new Date().toISOString(),
		}
	},
	{
		auth: true,
	},
)
