import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { HomeContent } from '@/app/[locale]/dashboard/home-content'
import { bookmark, folder, folderCollaborator, user } from '@/drizzle/schema'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'
import { getBookmarkTags } from '@/server/tag-helpers'

export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)

	const session = await getSession()
	if (!session) redirect(`/${locale}/login`)

	const userId = session.user.id
	const queryClient = getQueryClient()

	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: ['bookmarks', 'root'],
			queryFn: async () => {
				const bookmarks = await db
					.select()
					.from(bookmark)
					.where(and(eq(bookmark.userId, userId), isNull(bookmark.folderId)))
					.orderBy(asc(bookmark.position))
				const tagsMap = await getBookmarkTags(bookmarks.map((b) => b.id))
				return bookmarks.map((b) => ({
					...b,
					tags: tagsMap.get(b.id) ?? [],
				}))
			},
		}),
		queryClient.prefetchQuery({
			queryKey: ['folders', 'root'],
			queryFn: async () => {
				const folders = await db
					.select()
					.from(folder)
					.where(and(eq(folder.userId, userId), isNull(folder.parentId)))
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
			queryKey: ['shared-folders'],
			queryFn: () =>
				db
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
					.where(eq(folderCollaborator.userId, userId)),
		}),
	])

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HomeContent />
		</HydrationBoundary>
	)
}
