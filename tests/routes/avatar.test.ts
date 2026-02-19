import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

// NOTE: POST /api/avatar/upload uses t.File() which Elysia's .handle() cannot
// parse from FormData in unit tests. These routes need integration tests with
// an actual HTTP server. The DELETE route works fine since it has no body.

describe('DELETE /api/avatar', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(
			createRequest('/api/avatar', { method: 'DELETE' }),
		)
		expect(res.status).toBe(401)
	})

	test('deletes avatar', async () => {
		dbResults.update.push([])

		const res = await app.handle(
			createRequest('/api/avatar', { method: 'DELETE' }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ url: null })
	})
})
