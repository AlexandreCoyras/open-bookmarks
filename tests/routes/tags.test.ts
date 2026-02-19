import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

describe('GET /api/tags', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(createRequest('/api/tags'))
		expect(res.status).toBe(401)
	})

	test('returns user tags', async () => {
		dbResults.select.push([
			{ id: 't-1', name: 'dev' },
			{ id: 't-2', name: 'work' },
		])

		const res = await app.handle(createRequest('/api/tags'))
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(2)
		expect(body[0].name).toBe('dev')
	})

	test('returns empty array when user has no tags', async () => {
		dbResults.select.push([])

		const res = await app.handle(createRequest('/api/tags'))
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual([])
	})
})
