import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
	const sessionCookie = request.cookies.get('better-auth.session_token')

	if (!sessionCookie) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/', '/((?!login|register|api|_next|favicon|icon|manifest|sw).*)'],
}
