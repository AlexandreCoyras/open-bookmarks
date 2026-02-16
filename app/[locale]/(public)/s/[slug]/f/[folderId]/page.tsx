import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { and, asc, eq, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { PublicFolderContent } from '@/app/[locale]/(public)/s/[slug]/public-folder-content'
import { bookmark, folder, user } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

export default async function PublicSubfolderPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string; folderId: string }>
}) {
	const { locale, slug, folderId } = await params
	setRequestLocale(locale)

	const queryClient = getQueryClient()

	const [publicFolder] = await db
		.select({
			id: folder.id,
			name: folder.name,
			color: folder.color,
			parentId: folder.parentId,
			publicSlug: folder.publicSlug,
			owner: {
				name: user.name,
				image: user.image,
			},
		})
		.from(folder)
		.innerJoin(user, eq(folder.userId, user.id))
		.where(eq(folder.publicSlug, slug))

	if (!publicFolder) notFound()

	const rootUserId = await db
		.select({ userId: folder.userId })
		.from(folder)
		.where(eq(folder.publicSlug, slug))
		.then((rows) => rows[0]?.userId)

	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: ['public-folder', slug],
			queryFn: () => publicFolder,
		}),
		queryClient.prefetchQuery({
			queryKey: ['public-subfolders', slug, folderId],
			queryFn: () =>
				db
					.select({
						id: folder.id,
						name: folder.name,
						color: folder.color,
						parentId: folder.parentId,
						position: folder.position,
					})
					.from(folder)
					.where(
						and(eq(folder.userId, rootUserId!), eq(folder.parentId, folderId)),
					)
					.orderBy(asc(folder.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['public-bookmarks', slug, folderId],
			queryFn: () =>
				db
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
							eq(bookmark.userId, rootUserId!),
							eq(bookmark.folderId, folderId),
						),
					)
					.orderBy(asc(bookmark.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['public-breadcrumb', slug, folderId],
			queryFn: async () => {
				const result = await db.execute(sql`
					WITH RECURSIVE ancestors AS (
						SELECT id, name, parent_id, color, 0 AS depth
						FROM folder
						WHERE id = ${folderId} AND user_id = ${rootUserId}
						UNION ALL
						SELECT f.id, f.name, f.parent_id, f.color, a.depth + 1
						FROM folder f
						JOIN ancestors a ON f.id = a.parent_id
						WHERE f.user_id = ${rootUserId} AND a.depth < 20
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
			<PublicFolderContent slug={slug} folderId={folderId} />
		</HydrationBoundary>
	)
}
