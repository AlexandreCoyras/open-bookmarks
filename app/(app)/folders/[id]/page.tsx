import { and, asc, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { FolderContent } from '@/app/(app)/folders/[id]/folder-content'
import { bookmark, folder } from '@/drizzle/schema'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

export default async function FolderPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const session = await getSession()
	if (!session) redirect('/login')

	const userId = session.user.id
	const queryClient = getQueryClient()

	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: ['folder', id],
			queryFn: async () => {
				const [found] = await db
					.select()
					.from(folder)
					.where(and(eq(folder.id, id), eq(folder.userId, userId)))
				return found ?? null
			},
		}),
		queryClient.prefetchQuery({
			queryKey: ['folders', id],
			queryFn: () =>
				db
					.select()
					.from(folder)
					.where(and(eq(folder.userId, userId), eq(folder.parentId, id)))
					.orderBy(asc(folder.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['bookmarks', id],
			queryFn: () =>
				db
					.select()
					.from(bookmark)
					.where(and(eq(bookmark.userId, userId), eq(bookmark.folderId, id)))
					.orderBy(asc(bookmark.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['breadcrumb', id],
			queryFn: async () => {
				const result = await db.execute(sql`
					WITH RECURSIVE ancestors AS (
						SELECT id, name, parent_id, color, 0 AS depth
						FROM folder
						WHERE id = ${id} AND user_id = ${userId}
						UNION ALL
						SELECT f.id, f.name, f.parent_id, f.color, a.depth + 1
						FROM folder f
						JOIN ancestors a ON f.id = a.parent_id
						WHERE f.user_id = ${userId} AND a.depth < 20
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
		}),
	])

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FolderContent id={id} />
		</HydrationBoundary>
	)
}
