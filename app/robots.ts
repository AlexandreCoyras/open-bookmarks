import type { MetadataRoute } from 'next'

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://open-bookmarks.vercel.app'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: ['/', '/login', '/register'],
				disallow: ['/dashboard', '/api', '/s'],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}
