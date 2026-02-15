import { and, eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { folder, folderCollaborator, user } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const collaboratorRoutes = new Elysia({ prefix: '/collaborators' })
	.use(authPlugin)
	.get(
		'/folders/:folderId',
		async ({ user: u, params, status }) => {
			// Verify caller is owner of the folder
			const [f] = await db
				.select({ userId: folder.userId })
				.from(folder)
				.where(eq(folder.id, params.folderId))

			if (!f || f.userId !== u.id) return status(403)

			const collaborators = await db
				.select({
					id: folderCollaborator.id,
					role: folderCollaborator.role,
					createdAt: folderCollaborator.createdAt,
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image,
					},
				})
				.from(folderCollaborator)
				.innerJoin(user, eq(user.id, folderCollaborator.userId))
				.where(eq(folderCollaborator.folderId, params.folderId))

			return collaborators
		},
		{
			auth: true,
			params: t.Object({ folderId: t.String() }),
		},
	)
	.post(
		'/folders/:folderId',
		async ({ user: u, params, body, status }) => {
			// Verify caller is owner
			const [f] = await db
				.select({ userId: folder.userId })
				.from(folder)
				.where(eq(folder.id, params.folderId))

			if (!f || f.userId !== u.id) return status(403)

			// Find target user by email
			const [targetUser] = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				})
				.from(user)
				.where(eq(user.email, body.email.toLowerCase().trim()))

			if (!targetUser) return status(404)

			// Cannot invite yourself
			if (targetUser.id === u.id) return status(400)

			// Check if already exists
			const [existing] = await db
				.select({ id: folderCollaborator.id })
				.from(folderCollaborator)
				.where(
					and(
						eq(folderCollaborator.folderId, params.folderId),
						eq(folderCollaborator.userId, targetUser.id),
					),
				)

			if (existing) return status(409)

			const [created] = await db
				.insert(folderCollaborator)
				.values({
					folderId: params.folderId,
					userId: targetUser.id,
					role: body.role,
				})
				.returning()

			return {
				id: created.id,
				role: created.role,
				createdAt: created.createdAt,
				user: targetUser,
			}
		},
		{
			auth: true,
			params: t.Object({ folderId: t.String() }),
			body: t.Object({
				email: t.String(),
				role: t.Union([t.Literal('viewer'), t.Literal('editor')]),
			}),
		},
	)
	.patch(
		'/:id',
		async ({ user: u, params, body, status }) => {
			// Get the collaborator record + verify ownership
			const [collab] = await db
				.select({
					id: folderCollaborator.id,
					folderId: folderCollaborator.folderId,
				})
				.from(folderCollaborator)
				.where(eq(folderCollaborator.id, params.id))

			if (!collab) return status(404)

			const [f] = await db
				.select({ userId: folder.userId })
				.from(folder)
				.where(eq(folder.id, collab.folderId))

			if (!f || f.userId !== u.id) return status(403)

			const [updated] = await db
				.update(folderCollaborator)
				.set({ role: body.role })
				.where(eq(folderCollaborator.id, params.id))
				.returning()

			return updated
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
			body: t.Object({
				role: t.Union([t.Literal('viewer'), t.Literal('editor')]),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ user: u, params, status }) => {
			const [collab] = await db
				.select({
					id: folderCollaborator.id,
					folderId: folderCollaborator.folderId,
				})
				.from(folderCollaborator)
				.where(eq(folderCollaborator.id, params.id))

			if (!collab) return status(404)

			const [f] = await db
				.select({ userId: folder.userId })
				.from(folder)
				.where(eq(folder.id, collab.folderId))

			if (!f || f.userId !== u.id) return status(403)

			await db
				.delete(folderCollaborator)
				.where(eq(folderCollaborator.id, params.id))

			return { success: true }
		},
		{
			auth: true,
			params: t.Object({ id: t.String() }),
		},
	)
	.get(
		'/shared-with-me',
		async ({ user: u }) => {
			const shared = await db
				.select({
					id: folderCollaborator.id,
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

			return shared
		},
		{
			auth: true,
		},
	)
