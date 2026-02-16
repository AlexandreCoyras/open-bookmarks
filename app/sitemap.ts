import { isNotNull } from 'drizzle-orm'
import type { MetadataRoute } from 'next'
import { folder } from '@/drizzle/schema'
import { routing } from '@/i18n/routing'
import { db } from '@/lib/db'

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'

const pages = ['', '/login', '/register']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticEntries = pages.flatMap((page) => {
		const languages = Object.fromEntries(
			routing.locales.map((locale) => [locale, `${baseUrl}/${locale}${page}`]),
		)

		return routing.locales.map((locale) => ({
			url: `${baseUrl}/${locale}${page}`,
			lastModified: new Date(),
			changeFrequency: page === '' ? 'monthly' : ('monthly' as const),
			priority: page === '' ? 1 : 0.5,
			alternates: { languages },
		}))
	})

	const publicFolders = await db
		.select({ publicSlug: folder.publicSlug, updatedAt: folder.updatedAt })
		.from(folder)
		.where(isNotNull(folder.publicSlug))

	const publicEntries = publicFolders.flatMap((f) => {
		const languages = Object.fromEntries(
			routing.locales.map((locale) => [
				locale,
				`${baseUrl}/${locale}/s/${f.publicSlug}`,
			]),
		)

		return routing.locales.map((locale) => ({
			url: `${baseUrl}/${locale}/s/${f.publicSlug}`,
			lastModified: f.updatedAt ?? new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.6,
			alternates: { languages },
		}))
	})

	return [...staticEntries, ...publicEntries] as MetadataRoute.Sitemap
}
