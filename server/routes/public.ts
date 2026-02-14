import { and, asc, eq, sql } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { bookmark, folder, user } from '@/drizzle/schema'
import { db } from '@/lib/db'

export const publicRoutes = new Elysia({ prefix: '/public' })
	.get(
		'/folders/:slug',
		async ({ params, status }) => {
			const [found] = await db
				.select({
					id: folder.id,
					name: folder.name,
					color: folder.color,
					icon: folder.icon,
					parentId: folder.parentId,
					publicSlug: folder.publicSlug,
					owner: {
						name: user.name,
						image: user.image,
					},
				})
				.from(folder)
				.innerJoin(user, eq(folder.userId, user.id))
				.where(eq(folder.publicSlug, params.slug))

			if (!found) return status(404)

			return found
		},
		{
			params: t.Object({ slug: t.String() }),
		},
	)
	.get(
		'/folders/:slug/subfolders',
		async ({ params, query, status }) => {
			const [root] = await db
				.select({ id: folder.id, userId: folder.userId })
				.from(folder)
				.where(eq(folder.publicSlug, params.slug))

			if (!root) return status(404)

			const parentId = query.parentId ?? root.id

			return db
				.select({
					id: folder.id,
					name: folder.name,
					color: folder.color,
					icon: folder.icon,
					parentId: folder.parentId,
					position: folder.position,
				})
				.from(folder)
				.where(
					and(eq(folder.userId, root.userId), eq(folder.parentId, parentId)),
				)
				.orderBy(asc(folder.position))
		},
		{
			params: t.Object({ slug: t.String() }),
			query: t.Object({
				parentId: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/folders/:slug/bookmarks',
		async ({ params, query, status }) => {
			const [root] = await db
				.select({ id: folder.id, userId: folder.userId })
				.from(folder)
				.where(eq(folder.publicSlug, params.slug))

			if (!root) return status(404)

			const folderId = query.folderId ?? root.id

			return db
				.select({
					id: bookmark.id,
					url: bookmark.url,
					title: bookmark.title,
					description: bookmark.description,
					favicon: bookmark.favicon,
					folderId: bookmark.folderId,
					position: bookmark.position,
				})
				.from(bookmark)
				.where(
					and(
						eq(bookmark.userId, root.userId),
						eq(bookmark.folderId, folderId),
					),
				)
				.orderBy(asc(bookmark.position))
		},
		{
			params: t.Object({ slug: t.String() }),
			query: t.Object({
				folderId: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/folders/:slug/breadcrumb',
		async ({ params, query, status }) => {
			const [root] = await db
				.select({ id: folder.id, userId: folder.userId })
				.from(folder)
				.where(eq(folder.publicSlug, params.slug))

			if (!root) return status(404)

			if (!query.folderId) return []

			const result = await db.execute(sql`
				WITH RECURSIVE ancestors AS (
					SELECT id, name, parent_id, color, icon, 0 AS depth
					FROM folder
					WHERE id = ${query.folderId} AND user_id = ${root.userId}
					UNION ALL
					SELECT f.id, f.name, f.parent_id, f.color, f.icon, a.depth + 1
					FROM folder f
					JOIN ancestors a ON f.id = a.parent_id
					WHERE f.user_id = ${root.userId} AND a.depth < 20
				)
				SELECT id, name, parent_id AS "parentId", color, icon FROM ancestors ORDER BY depth DESC
			`)

			return result.rows as {
				id: string
				name: string
				parentId: string | null
				color: string | null
				icon: string | null
			}[]
		},
		{
			params: t.Object({ slug: t.String() }),
			query: t.Object({
				folderId: t.Optional(t.String()),
			}),
		},
	)
