import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export async function middleware(request: NextRequest) {
	const response = handleI18nRouting(request)

	// Extract locale from the rewritten URL or the pathname
	const rewriteHeader = response.headers.get('x-middleware-rewrite')
	const pathname = rewriteHeader
		? new URL(rewriteHeader).pathname
		: request.nextUrl.pathname
	const segments = pathname.split('/').filter(Boolean)
	const locale = segments[0]

	// Public shared folders: /{locale}/s/{slug} — track views via cookie
	if (segments[1] === 's' && segments[2]) {
		const slug = segments[2]

		const viewedSlugs = (request.cookies.get('ob-viewed')?.value ?? '')
			.split(',')
			.filter(Boolean)
		const alreadyViewed = viewedSlugs.includes(slug)

		const requestHeaders = new Headers(request.headers)
		requestHeaders.set('x-already-viewed', alreadyViewed ? '1' : '0')

		const viewResponse = NextResponse.rewrite(request.nextUrl, {
			request: { headers: requestHeaders },
		})

		// Copy i18n headers/cookies
		for (const [key, value] of response.headers.entries()) {
			viewResponse.headers.set(key, value)
		}
		for (const cookie of response.cookies.getAll()) {
			viewResponse.cookies.set(cookie)
		}

		if (!alreadyViewed) {
			viewedSlugs.push(slug)
			viewResponse.cookies.set('ob-viewed', viewedSlugs.join(','), {
				maxAge: 24 * 60 * 60,
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
			})
		}

		return viewResponse
	}

	// Auth check for protected routes: /{locale}/dashboard
	if (segments[1] === 'dashboard') {
		const sessionCookie =
			request.cookies.get('better-auth.session_token') ||
			request.cookies.get('__Secure-better-auth.session_token')

		if (!sessionCookie) {
			const loginUrl = new URL(`/${locale}/login`, request.url)
			return NextResponse.redirect(loginUrl)
		}
	}

	return response
}

export const config = {
	matcher: '/((?!api|_next|_vercel|serwist|.*\\..*).*)',
}
