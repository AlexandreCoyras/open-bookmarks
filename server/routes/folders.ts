import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { folder, folderCollaborator } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'
import { getFolderAccess } from '@/server/folder-access'

async function enrichWithCollaborators<T extends { id: string }>(
	folders: T[],
): Promise<(T & { hasCollaborators: boolean })[]> {
	if (folders.length === 0) return []

	const result = await db
		.select({ folderId: folderCollaborator.folderId })
		.from(folderCollaborator)
		.where(
			sql`${folderCollaborator.folderId} IN (${sql.join(
				folders.map((f) => sql`${f.id}`),
				sql`, `,
			)})`,
		)
		.groupBy(folderCollaborator.folderId)

	const sharedIds = new Set(result.map((r) => r.folderId))
	return folders.map((f) => ({
		...f,
		hasCollaborators: sharedIds.has(f.id),
	}))
}

export const folderRoutes = new Elysia({ prefix: '/folders' })
	.use(authPlugin)
	.get(
		'/',
		async ({ user, query }) => {
			if (query.all === 'true') {
				const folders = await db
					.select()
					.from(folder)
					.where(eq(folder.userId, user.id))
					.orderBy(asc(folder.position))
				return enrichWithCollaborators(folders)
			}

			const parentId = query.parentId

			// If a parentId is given, check if user has access (collaborator or owner)
			if (parentId) {
				const access = await getFolderAccess(user.id, parentId)
				if (access) {
					const folders = await db
						.select()
						.from(folder)
						.where(
							and(
								eq(folder.userId, access.ownerId),
								eq(folder.parentId, parentId),
							),
						)
						.orderBy(asc(folder.position))
					return enrichWithCollaborators(folders)
				}
			}

			const condition = parentId
				? and(eq(folder.userId, user.id), eq(folder.parentId, parentId))
				: and(eq(folder.userId, user.id), isNull(folder.parentId))

			const folders = await db
				.select()
				.from(folder)
				.where(condition)
				.orderBy(asc(folder.position))

			return enrichWithCollaborators(folders)
		},
		{
			auth: true,
			query: t.Object({
				parentId: t.Optional(t.String()),
				all: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/check-slug',
		async ({ query }) => {
			const slug = query.slug.toLowerCase().trim()
			const conditions = [eq(folder.publicSlug, slug)]
			if (query.folderId) {
				conditions.push(ne(folder.id, query.folderId))
			}

			const [existing] = await db
				.select({ id: folder.id })
				.from(folder)
				.where(and(...conditions))
				.limit(1)

			return { available: !existing }
		},
		{
			auth: true,
			query: t.Object({
				slug: t.String(),
				folderId: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/:id',
		async ({ user, params, status }) => {
			const access = await getFolderAccess(user.id, params.id)
			if (!access) return status(404)

			const [found] = await db
				.select()
				.from(folder)
				.where(eq(folder.id, params.id))

			if (!found) return status(404)

			// Check if this folder has any collaborators (for owner to show badge)
			let hasCollaborators = false
			if (access.access === 'owner') {
				const [collab] = await db
					.select({ id: folderCollaborator.id })
					.from(folderCollaborator)
					.where(eq(folderCollaborator.folderId, params.id))
					.limit(1)
				hasCollaborators = !!collab
			}

			return { ...found, access: access.access, hasCollaborators }
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.get(
		'/:id/breadcrumb',
		async ({ user, params }) => {
			const access = await getFolderAccess(user.id, params.id)
			if (!access) return []

			const ownerId = access.ownerId

			const result = await db.execute(sql`
				WITH RECURSIVE ancestors AS (
					SELECT id, name, parent_id, color, icon, 0 AS depth
					FROM folder
					WHERE id = ${params.id} AND user_id = ${ownerId}
					UNION ALL
					SELECT f.id, f.name, f.parent_id, f.color, f.icon, a.depth + 1
					FROM folder f
					JOIN ancestors a ON f.id = a.parent_id
					WHERE f.user_id = ${ownerId} AND a.depth < 20
				)
				SELECT id, name, parent_id AS "parentId", color, icon FROM ancestors ORDER BY depth DESC
			`)

			const rows = result.rows as {
				id: string
				name: string
				parentId: string | null
				color: string | null
				icon: string | null
			}[]

			// If collaborator, truncate breadcrumb at the shared folder level
			if (access.access !== 'owner') {
				// Find the shared folder (the one with a folderCollaborator entry for this user)
				const sharedResult = await db.execute(sql`
					SELECT folder_id FROM folder_collaborator
					WHERE user_id = ${user.id}
					AND folder_id IN (${sql.join(
						rows.map((r) => sql`${r.id}`),
						sql`, `,
					)})
					LIMIT 1
				`)
				if (sharedResult.rows.length > 0) {
					const sharedFolderId = (sharedResult.rows[0] as { folder_id: string })
						.folder_id
					const idx = rows.findIndex((r) => r.id === sharedFolderId)
					if (idx >= 0) {
						return rows.slice(idx)
					}
				}
			}

			return rows
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		'/',
		async ({ user, body, status }) => {
			let userId = user.id

			if (body.parentId) {
				const access = await getFolderAccess(user.id, body.parentId)
				if (
					!access ||
					(access.access !== 'owner' && access.access !== 'editor')
				) {
					return status(403)
				}
				userId = access.ownerId
			}

			const [created] = await db
				.insert(folder)
				.values({
					name: body.name,
					color: body.color,
					icon: body.icon,
					parentId: body.parentId,
					userId,
					position: body.position ?? 0,
				})
				.returning()

			return created
		},
		{
			auth: true,
			body: t.Object({
				name: t.String(),
				color: t.Optional(t.String()),
				icon: t.Optional(t.String()),
				parentId: t.Optional(t.String()),
				position: t.Optional(t.Number()),
			}),
		},
	)
	.patch(
		'/:id',
		async ({ user, params, body, status }) => {
			const access = await getFolderAccess(user.id, params.id)
			if (
				!access ||
				(access.access !== 'owner' && access.access !== 'editor')
			) {
				return status(403)
			}

			// publicSlug changes require owner
			if (body.publicSlug !== undefined && access.access !== 'owner') {
				return status(403)
			}

			if (body.publicSlug !== undefined && body.publicSlug !== null) {
				const slug = body.publicSlug.toLowerCase().trim()
				const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/
				if (!slugRegex.test(slug)) {
					return status(422)
				}

				const [existing] = await db
					.select({ id: folder.id })
					.from(folder)
					.where(and(eq(folder.publicSlug, slug), ne(folder.id, params.id)))
					.limit(1)

				if (existing) {
					return status(409)
				}

				body.publicSlug = slug
			}

			const [updated] = await db
				.update(folder)
				.set(body)
				.where(eq(folder.id, params.id))
				.returning()

			if (!updated) return status(404)

			return updated
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: t.Object({
				name: t.Optional(t.String()),
				color: t.Optional(t.String()),
				icon: t.Optional(t.Nullable(t.String())),
				parentId: t.Optional(t.Nullable(t.String())),
				position: t.Optional(t.Number()),
				publicSlug: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ user, params, status }) => {
			const access = await getFolderAccess(user.id, params.id)
			if (!access) return status(404)

			// Check if this folder is the root of collaboration (has a direct folderCollaborator entry)
			const [directCollab] = await db
				.select({ id: folderCollaborator.id })
				.from(folderCollaborator)
				.where(eq(folderCollaborator.folderId, params.id))
				.limit(1)

			if (directCollab) {
				// Only owner can delete a folder that has collaborators
				if (access.access !== 'owner') return status(403)
			} else {
				// Sub-folders: editor or owner can delete
				if (access.access !== 'owner' && access.access !== 'editor') {
					return status(403)
				}
			}

			const ownerId = access.ownerId

			// Collect the target folder + all descendant folders recursively
			const descendants = await db.execute(sql`
				WITH RECURSIVE tree AS (
					SELECT id FROM folder
					WHERE id = ${params.id} AND user_id = ${ownerId}
					UNION ALL
					SELECT f.id FROM folder f
					JOIN tree t ON f.parent_id = t.id
					WHERE f.user_id = ${ownerId}
				)
				SELECT id FROM tree
			`)

			const folderIds = descendants.rows.map((r) => (r as { id: string }).id)
			if (folderIds.length === 0) return status(404)

			// Delete all bookmarks in those folders, then the folders themselves
			await db.execute(sql`
				DELETE FROM bookmark WHERE folder_id IN (${sql.join(
					folderIds.map((id) => sql`${id}`),
					sql`, `,
				)})
			`)
			await db.execute(sql`
				DELETE FROM folder WHERE id IN (${sql.join(
					folderIds.map((id) => sql`${id}`),
					sql`, `,
				)}) AND user_id = ${ownerId}
			`)

			return { success: true }
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.put(
		'/reorder',
		async ({ user, body, status }) => {
			// Verify access for each item's parent folder
			for (const item of body.items) {
				if (item.parentId) {
					const access = await getFolderAccess(user.id, item.parentId)
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
						.update(folder)
						.set({ position: item.position, parentId: item.parentId })
						.where(eq(folder.id, item.id)),
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
						parentId: t.Optional(t.Nullable(t.String())),
					}),
				),
			}),
		},
	)
