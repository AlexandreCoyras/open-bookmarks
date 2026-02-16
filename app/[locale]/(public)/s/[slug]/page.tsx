import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PublicFolderContent } from '@/app/[locale]/(public)/s/[slug]/public-folder-content'
import { bookmark, folder, user } from '@/drizzle/schema'
import { routing } from '@/i18n/routing'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { getQueryClient } from '@/lib/get-query-client'

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
	const { locale, slug } = await params
	const t = await getTranslations('Metadata')

	const [found] = await db
		.select({
			name: folder.name,
			ownerName: user.name,
		})
		.from(folder)
		.innerJoin(user, eq(folder.userId, user.id))
		.where(eq(folder.publicSlug, slug))

	if (!found) return {}

	const title = t('sharedFolderTitle', { name: found.name })
	const description = t('sharedFolderDescription', {
		name: found.name,
		owner: found.ownerName,
	})

	return {
		title,
		description,
		alternates: {
			canonical: `${baseUrl}/${locale}/s/${slug}`,
			languages: {
				en: `${baseUrl}/en/s/${slug}`,
				fr: `${baseUrl}/fr/s/${slug}`,
			},
		},
		openGraph: {
			title,
			description,
			locale,
			alternateLocale: routing.locales.filter((l) => l !== locale),
			url: `${baseUrl}/${locale}/s/${slug}`,
		},
	}
}

export default async function PublicFolderPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>
}) {
	const { locale, slug } = await params
	setRequestLocale(locale)

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
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'CollectionPage',
						name: found.name,
						url: `${baseUrl}/${locale}/s/${slug}`,
						author: {
							'@type': 'Person',
							name: owner.name,
						},
					}),
				}}
			/>
			<HydrationBoundary state={dehydrate(queryClient)}>
				<PublicFolderContent slug={slug} />
			</HydrationBoundary>
		</>
	)
}
