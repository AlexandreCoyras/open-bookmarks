import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { asc, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { FolderContent } from '@/app/(app)/folders/[id]/folder-content'
import { bookmark, folder, folderCollaborator } from '@/drizzle/schema'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

async function getFolderAccessServer(userId: string, folderId: string) {
	const result = await db.execute(sql`
		WITH RECURSIVE ancestors AS (
			SELECT id, user_id, parent_id, 0 AS depth
			FROM folder
			WHERE id = ${folderId}
			UNION ALL
			SELECT f.id, f.user_id, f.parent_id, a.depth + 1
			FROM folder f
			JOIN ancestors a ON f.id = a.parent_id
			WHERE a.depth < 20
		)
		SELECT
			a.id        AS "folderId",
			a.user_id   AS "ownerId",
			a.depth,
			CASE
				WHEN a.user_id = ${userId} THEN 'owner'
				ELSE fc.role
			END AS access
		FROM ancestors a
		LEFT JOIN folder_collaborator fc
			ON fc.folder_id = a.id AND fc.user_id = ${userId}
		WHERE a.user_id = ${userId} OR fc.id IS NOT NULL
		ORDER BY a.depth ASC
		LIMIT 1
	`)

	if (result.rows.length === 0) return null

	const row = result.rows[0] as {
		folderId: string
		ownerId: string
		depth: number
		access: 'owner' | 'editor' | 'viewer'
	}

	const ownerResult = await db.execute(sql`
		SELECT user_id AS "ownerId" FROM folder WHERE id = ${folderId}
	`)
	if (ownerResult.rows.length === 0) return null
	const ownerId = (ownerResult.rows[0] as { ownerId: string }).ownerId

	return { access: row.access, ownerId }
}

export default async function FolderPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const session = await getSession()
	if (!session) redirect('/login')

	const userId = session.user.id
	const folderAccess = await getFolderAccessServer(userId, id)

	if (!folderAccess) redirect('/')

	const ownerId = folderAccess.ownerId
	const queryClient = getQueryClient()

	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: ['folder', id],
			queryFn: async () => {
				const [found] = await db.select().from(folder).where(eq(folder.id, id))

				if (!found) return null

				let hasCollaborators = false
				if (folderAccess.access === 'owner') {
					const [collab] = await db
						.select({ id: folderCollaborator.id })
						.from(folderCollaborator)
						.where(eq(folderCollaborator.folderId, id))
						.limit(1)
					hasCollaborators = !!collab
				}

				return {
					...found,
					access: folderAccess.access,
					hasCollaborators,
				}
			},
		}),
		queryClient.prefetchQuery({
			queryKey: ['folders', id],
			queryFn: async () => {
				const folders = await db
					.select()
					.from(folder)
					.where(
						sql`${folder.userId} = ${ownerId} AND ${folder.parentId} = ${id}`,
					)
					.orderBy(asc(folder.position))

				if (folders.length === 0) return []

				const collabs = await db
					.select({ folderId: folderCollaborator.folderId })
					.from(folderCollaborator)
					.where(
						sql`${folderCollaborator.folderId} IN (${sql.join(
							folders.map((f) => sql`${f.id}`),
							sql`, `,
						)})`,
					)
					.groupBy(folderCollaborator.folderId)

				const sharedIds = new Set(collabs.map((r) => r.folderId))
				return folders.map((f) => ({
					...f,
					hasCollaborators: sharedIds.has(f.id),
				}))
			},
		}),
		queryClient.prefetchQuery({
			queryKey: ['bookmarks', id],
			queryFn: () =>
				db
					.select()
					.from(bookmark)
					.where(
						sql`${bookmark.userId} = ${ownerId} AND ${bookmark.folderId} = ${id}`,
					)
					.orderBy(asc(bookmark.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['breadcrumb', id],
			queryFn: async () => {
				const result = await db.execute(sql`
					WITH RECURSIVE ancestors AS (
						SELECT id, name, parent_id, color, 0 AS depth
						FROM folder
						WHERE id = ${id} AND user_id = ${ownerId}
						UNION ALL
						SELECT f.id, f.name, f.parent_id, f.color, a.depth + 1
						FROM folder f
						JOIN ancestors a ON f.id = a.parent_id
						WHERE f.user_id = ${ownerId} AND a.depth < 20
					)
					SELECT id, name, parent_id AS "parentId", color FROM ancestors ORDER BY depth DESC
				`)

				let rows = result.rows as {
					id: string
					name: string
					parentId: string | null
					color: string | null
				}[]

				// Truncate breadcrumb for collaborators
				if (folderAccess.access !== 'owner') {
					const sharedResult = await db.execute(sql`
						SELECT folder_id FROM folder_collaborator
						WHERE user_id = ${userId}
						AND folder_id IN (${sql.join(
							rows.map((r) => sql`${r.id}`),
							sql`, `,
						)})
						LIMIT 1
					`)
					if (sharedResult.rows.length > 0) {
						const sharedFolderId = (
							sharedResult.rows[0] as { folder_id: string }
						).folder_id
						const idx = rows.findIndex((r) => r.id === sharedFolderId)
						if (idx >= 0) {
							rows = rows.slice(idx)
						}
					}
				}

				return rows
			},
		}),
	])

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FolderContent id={id} />
		</HydrationBoundary>
	)
}
