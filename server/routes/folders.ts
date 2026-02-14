import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { folder } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const folderRoutes = new Elysia({ prefix: '/folders' })
	.use(authPlugin)
	.get(
		'/',
		async ({ user, query }) => {
			const parentId = query.parentId
			const condition = parentId
				? and(eq(folder.userId, user.id), eq(folder.parentId, parentId))
				: and(eq(folder.userId, user.id), isNull(folder.parentId))

			return db
				.select()
				.from(folder)
				.where(condition)
				.orderBy(asc(folder.position))
		},
		{
			auth: true,
			query: t.Object({
				parentId: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/:id',
		async ({ user, params, status }) => {
			const [found] = await db
				.select()
				.from(folder)
				.where(and(eq(folder.id, params.id), eq(folder.userId, user.id)))

			if (!found) return status(404)

			return found
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.get(
		'/:id/breadcrumb',
		async ({ user, params }) => {
			const result = await db.execute(sql`
				WITH RECURSIVE ancestors AS (
					SELECT id, name, parent_id, color, 0 AS depth
					FROM folder
					WHERE id = ${params.id} AND user_id = ${user.id}
					UNION ALL
					SELECT f.id, f.name, f.parent_id, f.color, a.depth + 1
					FROM folder f
					JOIN ancestors a ON f.id = a.parent_id
					WHERE f.user_id = ${user.id} AND a.depth < 20
				)
				SELECT id, name, parent_id AS "parentId", color FROM ancestors ORDER BY depth DESC
			`)

			return result.rows as {
				id: string
				name: string
				parentId: string | null
				color: string | null
			}[]
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		'/',
		async ({ user, body }) => {
			const [created] = await db
				.insert(folder)
				.values({
					name: body.name,
					color: body.color,
					parentId: body.parentId,
					userId: user.id,
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
				parentId: t.Optional(t.String()),
				position: t.Optional(t.Number()),
			}),
		},
	)
	.patch(
		'/:id',
		async ({ user, params, body, status }) => {
			const [updated] = await db
				.update(folder)
				.set(body)
				.where(and(eq(folder.id, params.id), eq(folder.userId, user.id)))
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
				parentId: t.Optional(t.Nullable(t.String())),
				position: t.Optional(t.Number()),
				publicSlug: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ user, params, status }) => {
			const [deleted] = await db
				.delete(folder)
				.where(and(eq(folder.id, params.id), eq(folder.userId, user.id)))
				.returning()

			if (!deleted) return status(404)

			return { success: true }
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.put(
		'/reorder',
		async ({ user, body }) => {
			await Promise.all(
				body.items.map((item) =>
					db
						.update(folder)
						.set({ position: item.position, parentId: item.parentId })
						.where(and(eq(folder.id, item.id), eq(folder.userId, user.id))),
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
