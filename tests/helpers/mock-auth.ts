/**
 * Configurable auth mock for Better Auth.
 *
 * By default, `getSession` returns a valid user/session pair.
 * Use `clearMockSession()` to simulate unauthenticated requests (→ 401).
 */

export const TEST_USER = {
	id: 'test-user-id',
	name: 'Test User',
	email: 'test@example.com',
	emailVerified: true,
	image: null,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
}

export const TEST_SESSION = {
	id: 'test-session-id',
	userId: TEST_USER.id,
	token: 'test-token',
	expiresAt: new Date(Date.now() + 86_400_000),
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
	ipAddress: '127.0.0.1',
	userAgent: 'bun-test',
}

let currentSession: {
	user: typeof TEST_USER
	session: typeof TEST_SESSION
} | null = {
	user: TEST_USER,
	session: TEST_SESSION,
}

export function setMockSession(session: typeof currentSession) {
	currentSession = session
}

export function clearMockSession() {
	currentSession = null
}

export function restoreMockSession() {
	currentSession = { user: TEST_USER, session: TEST_SESSION }
}

export const mockAuth = {
	handler: (_req: Request) => new Response(null, { status: 404 }),
	api: {
		getSession: () => Promise.resolve(currentSession),
	},
}
