import type { MetadataRoute } from 'next'

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: [
					'/en',
					'/en/login',
					'/en/register',
					'/en/s',
					'/fr',
					'/fr/login',
					'/fr/register',
					'/fr/s',
				],
				disallow: ['/en/dashboard', '/fr/dashboard', '/api'],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}
