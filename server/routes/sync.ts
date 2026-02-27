import { asc, eq, inArray, sql } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { bookmark, folder, folderCollaborator, user } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const syncRoutes = new Elysia({ prefix: '/sync' })
	.use(authPlugin)
	.get(
		'/snapshot',
		async ({ user: u }) => {
			const [allFolders, allBookmarks] = await Promise.all([
				db
					.select()
					.from(folder)
					.where(eq(folder.userId, u.id))
					.orderBy(asc(folder.position)),
				db
					.select()
					.from(bookmark)
					.where(eq(bookmark.userId, u.id))
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
	.get(
		'/shared-snapshot',
		async ({ user: u }) => {
			// Get shared folders (same pattern as GET /collaborators/shared-with-me)
			const sharedFolders = await db
				.select({
					collaboratorId: folderCollaborator.id,
					role: folderCollaborator.role,
					folder: {
						id: folder.id,
						name: folder.name,
						color: folder.color,
						icon: folder.icon,
					},
					owner: {
						id: user.id,
						name: user.name,
						image: user.image,
					},
				})
				.from(folderCollaborator)
				.innerJoin(folder, eq(folder.id, folderCollaborator.folderId))
				.innerJoin(user, eq(user.id, folder.userId))
				.where(eq(folderCollaborator.userId, u.id))

			if (sharedFolders.length === 0) {
				return {
					sharedFolders: [],
					folders: [],
					bookmarks: [],
					serverTime: new Date().toISOString(),
				}
			}

			const rootFolderIds = sharedFolders.map((sf) => sf.folder.id)

			// Recursive CTE to get all descendant folders
			const descendantResult = await db.execute(sql`
				WITH RECURSIVE descendants AS (
					SELECT id, name, parent_id, position, color, icon, user_id, updated_at, created_at
					FROM folder
					WHERE id IN (${sql.join(
						rootFolderIds.map((id) => sql`${id}`),
						sql`, `,
					)})
					UNION ALL
					SELECT f.id, f.name, f.parent_id, f.position, f.color, f.icon, f.user_id, f.updated_at, f.created_at
					FROM folder f
					JOIN descendants d ON f.parent_id = d.id
				)
				SELECT * FROM descendants ORDER BY position ASC
			`)

			const allFolders = (
				descendantResult.rows as Array<{
					id: string
					name: string
					parent_id: string | null
					position: number
					color: string | null
					icon: string | null
					user_id: string
					updated_at: Date
					created_at: Date
				}>
			).map((row) => ({
				id: row.id,
				name: row.name,
				parentId: row.parent_id,
				position: row.position,
				color: row.color,
				icon: row.icon,
				updatedAt: new Date(row.updated_at).toISOString(),
				createdAt: new Date(row.created_at).toISOString(),
			}))

			const allFolderIds = allFolders.map((f) => f.id)

			// Get bookmarks in all those folders
			const allBookmarks =
				allFolderIds.length > 0
					? await db
							.select()
							.from(bookmark)
							.where(inArray(bookmark.folderId, allFolderIds))
							.orderBy(asc(bookmark.position))
					: []

			return {
				sharedFolders,
				folders: allFolders,
				bookmarks: allBookmarks,
				serverTime: new Date().toISOString(),
			}
		},
		{
			auth: true,
		},
	)
