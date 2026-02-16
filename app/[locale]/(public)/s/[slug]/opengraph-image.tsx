import { and, count, eq } from 'drizzle-orm'
import { ImageResponse } from 'next/og'
import { bookmark, folder, user } from '@/drizzle/schema'
import { db } from '@/lib/db'

export const alt = 'Open Bookmarks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	const [found] = await db
		.select({
			name: folder.name,
			userId: folder.userId,
			id: folder.id,
		})
		.from(folder)
		.where(eq(folder.publicSlug, slug))

	if (!found) {
		return new ImageResponse(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#09090b',
					color: '#fafafa',
					fontSize: 48,
				}}
			>
				Open Bookmarks
			</div>,
			size,
		)
	}

	const [owner] = await db
		.select({ name: user.name })
		.from(user)
		.where(eq(user.id, found.userId))

	const [bookmarkCount] = await db
		.select({ count: count() })
		.from(bookmark)
		.where(
			and(eq(bookmark.userId, found.userId), eq(bookmark.folderId, found.id)),
		)

	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#09090b',
				color: '#fafafa',
				padding: 60,
			}}
		>
			<div
				style={{
					fontSize: 24,
					color: '#a1a1aa',
					marginBottom: 16,
				}}
			>
				Open Bookmarks
			</div>
			<div
				style={{
					fontSize: 56,
					fontWeight: 700,
					textAlign: 'center',
					lineHeight: 1.2,
					marginBottom: 24,
				}}
			>
				{found.name}
			</div>
			<div
				style={{
					fontSize: 24,
					color: '#a1a1aa',
					display: 'flex',
					gap: 16,
				}}
			>
				<span>by {owner?.name ?? 'Unknown'}</span>
				<span>·</span>
				<span>{bookmarkCount?.count ?? 0} bookmarks</span>
			</div>
		</div>,
		size,
	)
}
