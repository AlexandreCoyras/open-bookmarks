import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

describe('GET /api/search', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(
			createRequest('/api/search', { query: { q: 'test' } }),
		)
		expect(res.status).toBe(401)
	})

	test('returns 422 when query too short', async () => {
		const res = await app.handle(
			createRequest('/api/search', { query: { q: 'a' } }),
		)
		expect(res.status).toBe(422)
	})

	test('returns search results across folders and bookmarks', async () => {
		// 3 parallel queries: folders, text bookmarks, tag bookmarks
		dbResults.select.push([
			{
				id: 'f-1',
				name: 'Dev Tools',
				color: '#ff0000',
				icon: null,
				parentId: null,
			},
		])
		dbResults.select.push([
			{
				id: 'bm-1',
				url: 'https://dev.to',
				title: 'Dev.to',
				description: null,
				favicon: null,
				folderId: 'f-1',
			},
		])
		dbResults.select.push([]) // no tag matches
		// parent folder name lookup
		dbResults.select.push([{ id: 'f-1', name: 'Dev Tools' }])

		const res = await app.handle(
			createRequest('/api/search', { query: { q: 'dev' } }),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.folders).toHaveLength(1)
		expect(body.bookmarks).toHaveLength(1)
		expect(body.bookmarks[0].folderName).toBe('Dev Tools')
	})

	test('returns empty results', async () => {
		dbResults.select.push([])
		dbResults.select.push([])
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/search', { query: { q: 'zzzzz' } }),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.folders).toEqual([])
		expect(body.bookmarks).toEqual([])
	})
})
