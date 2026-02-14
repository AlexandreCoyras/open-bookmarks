import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { and, asc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PublicFolderContent } from '@/app/(public)/s/[slug]/public-folder-content'
import { bookmark, folder, user } from '@/drizzle/schema'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

export default async function PublicFolderPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const queryClient = getQueryClient()

	// Get folder data first
	const [found] = await db
		.select({
			id: folder.id,
			name: folder.name,
			color: folder.color,
			parentId: folder.parentId,
			publicSlug: folder.publicSlug,
			viewCount: folder.viewCount,
			userId: folder.userId,
		})
		.from(folder)
		.where(eq(folder.publicSlug, slug))

	if (!found) notFound()

	// Only increment if not the owner AND not already viewed (cookie-based, set by middleware)
	const headersList = await headers()
	const alreadyViewed = headersList.get('x-already-viewed') === '1'
	const session = await getSession()
	const isOwner = session?.user?.id === found.userId

	let viewCount = found.viewCount
	if (!isOwner && !alreadyViewed) {
		const [updated] = await db
			.update(folder)
			.set({ viewCount: sql`${folder.viewCount} + 1` })
			.where(eq(folder.publicSlug, slug))
			.returning({ viewCount: folder.viewCount })
		viewCount = updated.viewCount
	}

	const [owner] = await db
		.select({ name: user.name, image: user.image })
		.from(user)
		.where(eq(user.id, found.userId))

	const publicFolder = {
		id: found.id,
		name: found.name,
		color: found.color,
		parentId: found.parentId,
		publicSlug: found.publicSlug,
		viewCount,
		owner: owner!,
	}

	if (!publicFolder) notFound()

	const rootUserId = found.userId

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
