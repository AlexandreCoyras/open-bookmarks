import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { and, asc, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PublicFolderContent } from '@/app/(public)/s/[slug]/public-folder-content'
import { bookmark, folder, user } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

export default async function PublicFolderPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
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
			queryKey: ['public-subfolders', slug, 'root'],
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
						and(
							eq(folder.userId, rootUserId!),
							eq(folder.parentId, publicFolder.id),
						),
					)
					.orderBy(asc(folder.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['public-bookmarks', slug, 'root'],
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
							eq(bookmark.folderId, publicFolder.id),
						),
					)
					.orderBy(asc(bookmark.position)),
		}),
	])

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<PublicFolderContent slug={slug} />
		</HydrationBoundary>
	)
}
