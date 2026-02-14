import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
	// Handle public shared folder routes — track views via cookie
	if (request.nextUrl.pathname.startsWith('/s/')) {
		const slug = request.nextUrl.pathname.split('/')[2]
		if (!slug) return NextResponse.next()

		const viewedSlugs = (request.cookies.get('ob-viewed')?.value ?? '').split(',').filter(Boolean)
		const alreadyViewed = viewedSlugs.includes(slug)

		const requestHeaders = new Headers(request.headers)
		requestHeaders.set('x-already-viewed', alreadyViewed ? '1' : '0')

		const response = NextResponse.next({ request: { headers: requestHeaders } })

		if (!alreadyViewed) {
			viewedSlugs.push(slug)
			response.cookies.set('ob-viewed', viewedSlugs.join(','), {
				maxAge: 24 * 60 * 60,
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
			})
		}

		return response
	}

	// Auth check for protected routes
	const sessionCookie =
		request.cookies.get('better-auth.session_token') ||
		request.cookies.get('__Secure-better-auth.session_token')

	if (!sessionCookie) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/', '/s/:path*', '/((?!login|register|api|_next|favicon|icon|manifest|sw|serwist|~offline).*)'],
}
