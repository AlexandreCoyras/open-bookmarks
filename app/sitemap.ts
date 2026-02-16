import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'

const pages = ['', '/login', '/register']

export default function sitemap(): MetadataRoute.Sitemap {
	return pages.flatMap((page) => {
		const languages = Object.fromEntries(
			routing.locales.map((locale) => [locale, `${baseUrl}/${locale}${page}`]),
		)

		return routing.locales.map((locale) => ({
			url: `${baseUrl}/${locale}${page}`,
			lastModified: new Date(),
			changeFrequency: page === '' ? 'monthly' : 'monthly',
			priority: page === '' ? 1 : 0.5,
			alternates: { languages },
		}))
	}) as MetadataRoute.Sitemap
}
