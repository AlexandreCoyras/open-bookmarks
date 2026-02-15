import { and, asc, eq, isNull } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { bookmark } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'
import { getFolderAccess } from '@/server/folder-access'

export const bookmarkRoutes = new Elysia({ prefix: '/bookmarks' })
	.use(authPlugin)
	.get(
		'/',
		async ({ user, query }) => {
			const folderId = query.folderId

			if (folderId) {
				const access = await getFolderAccess(user.id, folderId)
				if (access) {
					return db
						.select()
						.from(bookmark)
						.where(
							and(
								eq(bookmark.userId, access.ownerId),
								eq(bookmark.folderId, folderId),
							),
						)
						.orderBy(asc(bookmark.position))
				}
			}

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
		async ({ user, body, status }) => {
			let userId = user.id

			if (body.folderId) {
				const access = await getFolderAccess(user.id, body.folderId)
				if (
					!access ||
					(access.access !== 'owner' && access.access !== 'editor')
				) {
					return status(403)
				}
				userId = access.ownerId
			}

			const [created] = await db
				.insert(bookmark)
				.values({
					url: body.url,
					title: body.title,
					description: body.description,
					favicon: body.favicon,
					folderId: body.folderId,
					userId,
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
			// Find the bookmark first
			const [found] = await db
				.select()
				.from(bookmark)
				.where(eq(bookmark.id, params.id))

			if (!found) return status(404)

			// Check access via the bookmark's folder
			if (found.folderId) {
				const access = await getFolderAccess(user.id, found.folderId)
				if (
					!access ||
					(access.access !== 'owner' && access.access !== 'editor')
				) {
					return status(403)
				}
			} else if (found.userId !== user.id) {
				return status(403)
			}

			// If moving to a new folder, check access there too
			if (
				body.folderId !== undefined &&
				body.folderId !== null &&
				body.folderId !== found.folderId
			) {
				const targetAccess = await getFolderAccess(user.id, body.folderId)
				if (
					!targetAccess ||
					(targetAccess.access !== 'owner' && targetAccess.access !== 'editor')
				) {
					return status(403)
				}
			}

			const [updated] = await db
				.update(bookmark)
				.set(body)
				.where(eq(bookmark.id, params.id))
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
			const [found] = await db
				.select()
				.from(bookmark)
				.where(eq(bookmark.id, params.id))

			if (!found) return status(404)

			if (found.folderId) {
				const access = await getFolderAccess(user.id, found.folderId)
				if (
					!access ||
					(access.access !== 'owner' && access.access !== 'editor')
				) {
					return status(403)
				}
			} else if (found.userId !== user.id) {
				return status(403)
			}

			await db.delete(bookmark).where(eq(bookmark.id, params.id))

			return { success: true }
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		'/bulk-delete',
		async ({ user, body, status }) => {
			if (body.ids.length === 0) return { success: true, deleted: 0 }

			// Verify access for each bookmark
			const bookmarks = await Promise.all(
				body.ids.map((id) =>
					db
						.select()
						.from(bookmark)
						.where(eq(bookmark.id, id))
						.then(([b]) => b),
				),
			)

			for (const b of bookmarks) {
				if (!b) continue
				if (b.folderId) {
					const access = await getFolderAccess(user.id, b.folderId)
					if (
						!access ||
						(access.access !== 'owner' && access.access !== 'editor')
					) {
						return status(403)
					}
				} else if (b.userId !== user.id) {
					return status(403)
				}
			}

			const deleted = await Promise.all(
				body.ids.map((id) =>
					db.delete(bookmark).where(eq(bookmark.id, id)).returning(),
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
		async ({ user, body, status }) => {
			if (body.ids.length === 0) return { success: true, moved: 0 }

			// Check access on target folder
			if (body.folderId) {
				const targetAccess = await getFolderAccess(user.id, body.folderId)
				if (
					!targetAccess ||
					(targetAccess.access !== 'owner' && targetAccess.access !== 'editor')
				) {
					return status(403)
				}
			}

			// Check access on source bookmarks
			const bookmarks = await Promise.all(
				body.ids.map((id) =>
					db
						.select()
						.from(bookmark)
						.where(eq(bookmark.id, id))
						.then(([b]) => b),
				),
			)

			for (const b of bookmarks) {
				if (!b) continue
				if (b.folderId) {
					const access = await getFolderAccess(user.id, b.folderId)
					if (
						!access ||
						(access.access !== 'owner' && access.access !== 'editor')
					) {
						return status(403)
					}
				} else if (b.userId !== user.id) {
					return status(403)
				}
			}

			const moved = await Promise.all(
				body.ids.map((id) =>
					db
						.update(bookmark)
						.set({ folderId: body.folderId })
						.where(eq(bookmark.id, id))
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
		async ({ user, body, status }) => {
			// Verify access for the first item's folder
			for (const item of body.items) {
				if (item.folderId) {
					const access = await getFolderAccess(user.id, item.folderId)
					if (
						!access ||
						(access.access !== 'owner' && access.access !== 'editor')
					) {
						return status(403)
					}
				}
			}

			await Promise.all(
				body.items.map((item) =>
					db
						.update(bookmark)
						.set({ position: item.position, folderId: item.folderId })
						.where(eq(bookmark.id, item.id)),
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
