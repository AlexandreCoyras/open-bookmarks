import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

beforeEach(() => {
	resetDbMocks()
	// Public routes should work without auth
	clearMockSession()
})

// ─── GET /api/public/folders/:slug ───────────────────────────────────

describe('GET /api/public/folders/:slug', () => {
	test('returns folder data without auth', async () => {
		dbResults.select.push([
			{
				id: 'f-1',
				name: 'Shared Dev',
				color: '#ff0000',
				icon: null,
				parentId: null,
				publicSlug: 'shared-dev',
				viewCount: 42,
				owner: { name: 'Alice', image: null },
			},
		])

		const res = await app.handle(
			createRequest('/api/public/folders/shared-dev'),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.name).toBe('Shared Dev')
		expect(body.owner.name).toBe('Alice')
	})

	test('returns 404 for unknown slug', async () => {
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/public/folders/nonexistent'),
		)
		expect(res.status).toBe(404)
	})
})

// ─── GET /api/public/folders/:slug/subfolders ────────────────────────

describe('GET /api/public/folders/:slug/subfolders', () => {
	test('returns subfolders', async () => {
		// root lookup
		dbResults.select.push([{ id: 'f-1', userId: 'owner-id' }])
		// subfolders
		dbResults.select.push([
			{
				id: 'f-2',
				name: 'Sub',
				color: null,
				icon: null,
				parentId: 'f-1',
				position: 0,
			},
		])

		const res = await app.handle(
			createRequest('/api/public/folders/my-slug/subfolders'),
		)
		expect(res.status).toBe(200)
		expect((await res.json())[0].name).toBe('Sub')
	})

	test('returns 404 when slug not found', async () => {
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/public/folders/bad-slug/subfolders'),
		)
		expect(res.status).toBe(404)
	})
})

// ─── GET /api/public/folders/:slug/bookmarks ─────────────────────────

describe('GET /api/public/folders/:slug/bookmarks', () => {
	test('returns bookmarks for public folder', async () => {
		// root lookup
		dbResults.select.push([{ id: 'f-1', userId: 'owner-id' }])
		// bookmarks
		dbResults.select.push([
			{
				id: 'bm-1',
				url: 'https://example.com',
				title: 'Example',
				description: null,
				favicon: null,
				folderId: 'f-1',
				position: 0,
			},
		])

		const res = await app.handle(
			createRequest('/api/public/folders/my-slug/bookmarks'),
		)
		expect(res.status).toBe(200)
		expect((await res.json())[0].title).toBe('Example')
	})
})

// ─── GET /api/public/folders/:slug/breadcrumb ────────────────────────

describe('GET /api/public/folders/:slug/breadcrumb', () => {
	test('returns empty array when no folderId given', async () => {
		dbResults.select.push([{ id: 'f-1', userId: 'owner-id' }])

		const res = await app.handle(
			createRequest('/api/public/folders/my-slug/breadcrumb'),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual([])
	})

	test('returns breadcrumb trail', async () => {
		dbResults.select.push([{ id: 'f-1', userId: 'owner-id' }])
		dbResults.execute.push({
			rows: [
				{ id: 'f-1', name: 'Root', parentId: null, color: null, icon: null },
				{ id: 'f-2', name: 'Sub', parentId: 'f-1', color: null, icon: null },
			],
		})

		const res = await app.handle(
			createRequest('/api/public/folders/my-slug/breadcrumb', {
				query: { folderId: 'f-2' },
			}),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(2)
	})
})
