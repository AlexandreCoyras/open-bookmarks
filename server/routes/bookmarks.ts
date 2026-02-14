import { and, asc, eq, isNull } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { bookmark } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const bookmarkRoutes = new Elysia({ prefix: '/bookmarks' })
	.use(authPlugin)
	.get(
		'/',
		async ({ user, query }) => {
			const folderId = query.folderId
			const condition = folderId
				? and(eq(bookmark.userId, user.id), eq(bookmark.folderId, folderId))
				: and(eq(bookmark.userId, user.id), isNull(bookmark.folderId))

			return db
				.select()
				.from(bookmark)
				.where(condition)
				.orderBy(asc(bookmark.position))
		},
		{
			auth: true,
			query: t.Object({
				folderId: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/',
		async ({ user, body }) => {
			const [created] = await db
				.insert(bookmark)
				.values({
					url: body.url,
					title: body.title,
					description: body.description,
					favicon: body.favicon,
					folderId: body.folderId,
					userId: user.id,
					position: body.position ?? 0,
				})
				.returning()

			return created
		},
		{
			auth: true,
			body: t.Object({
				url: t.String(),
				title: t.String(),
				description: t.Optional(t.String()),
				favicon: t.Optional(t.String()),
				folderId: t.Optional(t.String()),
				position: t.Optional(t.Number()),
			}),
		},
	)
	.patch(
		'/:id',
		async ({ user, params, body, status }) => {
			const [updated] = await db
				.update(bookmark)
				.set(body)
				.where(and(eq(bookmark.id, params.id), eq(bookmark.userId, user.id)))
				.returning()

			if (!updated) return status(404)

			return updated
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: t.Object({
				url: t.Optional(t.String()),
				title: t.Optional(t.String()),
				description: t.Optional(t.String()),
				favicon: t.Optional(t.String()),
				folderId: t.Optional(t.Nullable(t.String())),
				position: t.Optional(t.Number()),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ user, params, status }) => {
			const [deleted] = await db
				.delete(bookmark)
				.where(and(eq(bookmark.id, params.id), eq(bookmark.userId, user.id)))
				.returning()

			if (!deleted) return status(404)

			return { success: true }
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		'/bulk-delete',
		async ({ user, body }) => {
			if (body.ids.length === 0) return { success: true, deleted: 0 }

			const deleted = await Promise.all(
				body.ids.map((id) =>
					db
						.delete(bookmark)
						.where(and(eq(bookmark.id, id), eq(bookmark.userId, user.id)))
						.returning(),
				),
			)

			return { success: true, deleted: deleted.flat().length }
		},
		{
			auth: true,
			body: t.Object({
				ids: t.Array(t.String()),
			}),
		},
	)
	.post(
		'/bulk-move',
		async ({ user, body }) => {
			if (body.ids.length === 0) return { success: true, moved: 0 }

			const moved = await Promise.all(
				body.ids.map((id) =>
					db
						.update(bookmark)
						.set({ folderId: body.folderId })
						.where(and(eq(bookmark.id, id), eq(bookmark.userId, user.id)))
						.returning(),
				),
			)

			return { success: true, moved: moved.flat().length }
		},
		{
			auth: true,
			body: t.Object({
				ids: t.Array(t.String()),
				folderId: t.Nullable(t.String()),
			}),
		},
	)
	.put(
		'/reorder',
		async ({ user, body }) => {
			await Promise.all(
				body.items.map((item) =>
					db
						.update(bookmark)
						.set({ position: item.position, folderId: item.folderId })
						.where(and(eq(bookmark.id, item.id), eq(bookmark.userId, user.id))),
				),
			)

			return { success: true }
		},
		{
			auth: true,
			body: t.Object({
				items: t.Array(
					t.Object({
						id: t.String(),
						position: t.Number(),
						folderId: t.Optional(t.Nullable(t.String())),
					}),
				),
			}),
		},
	)
