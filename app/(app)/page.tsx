import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { HomeContent } from '@/app/(app)/home-content'
import { bookmark, folder } from '@/drizzle/schema'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

export default async function HomePage() {
	const session = await getSession()
	if (!session) redirect('/login')

	const userId = session.user.id
	const queryClient = getQueryClient()

	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: ['bookmarks', 'root'],
			queryFn: () =>
				db
					.select()
					.from(bookmark)
					.where(and(eq(bookmark.userId, userId), isNull(bookmark.folderId)))
					.orderBy(asc(bookmark.position)),
		}),
		queryClient.prefetchQuery({
			queryKey: ['folders', 'root'],
			queryFn: () =>
				db
					.select()
					.from(folder)
					.where(and(eq(folder.userId, userId), isNull(folder.parentId)))
					.orderBy(asc(folder.position)),
		}),
	])

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HomeContent />
		</HydrationBoundary>
	)
}
