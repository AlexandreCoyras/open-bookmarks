import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

describe('GET /api/export/bookmarks', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(createRequest('/api/export/bookmarks'))
		expect(res.status).toBe(401)
	})

	test('exports bookmarks as Netscape HTML', async () => {
		const now = new Date('2024-06-15')
		// select folders
		dbResults.select.push([
			{
				id: 'f-1',
				name: 'Dev',
				color: null,
				icon: null,
				parentId: null,
				userId: 'test-user-id',
				position: 0,
				publicSlug: null,
				viewCount: 0,
				createdAt: now,
				updatedAt: now,
			},
		])
		// select bookmarks
		dbResults.select.push([
			{
				id: 'bm-1',
				url: 'https://example.com',
				title: 'Example',
				description: null,
				favicon: null,
				folderId: 'f-1',
				userId: 'test-user-id',
				position: 0,
				createdAt: now,
				updatedAt: now,
			},
		])

		const res = await app.handle(createRequest('/api/export/bookmarks'))
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
		expect(res.headers.get('content-disposition')).toContain(
			'open-bookmarks-export-',
		)

		const html = await res.text()
		expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
		expect(html).toContain('Example')
		expect(html).toContain('https://example.com')
		expect(html).toContain('Dev')
	})

	test('exports empty bookmark file when no data', async () => {
		dbResults.select.push([]) // no folders
		dbResults.select.push([]) // no bookmarks

		const res = await app.handle(createRequest('/api/export/bookmarks'))
		expect(res.status).toBe(200)

		const html = await res.text()
		expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
	})
})
