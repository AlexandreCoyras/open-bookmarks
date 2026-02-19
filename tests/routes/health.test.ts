import { describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { createRequest } from '../helpers/request'

describe('GET /api/health', () => {
	test('returns 200 with status ok', async () => {
		const res = await app.handle(createRequest('/api/health'))
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ status: 'ok' })
	})
})
