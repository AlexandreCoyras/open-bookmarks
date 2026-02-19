import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

const BOOKMARK = {
	id: 'bm-1',
	url: 'https://example.com',
	title: 'Example',
	description: null,
	favicon: null,
	folderId: null,
	userId: 'test-user-id',
	position: 0,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
}

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

// ─── GET /api/bookmarks ──────────────────────────────────────────────

describe('GET /api/bookmarks', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(createRequest('/api/bookmarks'))
		expect(res.status).toBe(401)
	})

	test('returns root bookmarks with tags', async () => {
		// select from bookmark (root, no folderId)
		dbResults.select.push([BOOKMARK])
		// getBookmarkTags → select from bookmarkTag + tag
		dbResults.select.push([])

		const res = await app.handle(createRequest('/api/bookmarks'))
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(1)
		expect(body[0].id).toBe('bm-1')
		expect(body[0].tags).toEqual([])
	})

	test('returns bookmarks in a folder with access check', async () => {
		// getFolderAccess → db.execute CTE
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		// getFolderAccess → owner lookup
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// select bookmarks
		dbResults.select.push([{ ...BOOKMARK, folderId: 'f-1' }])
		// getBookmarkTags
		dbResults.select.push([
			{ bookmarkId: 'bm-1', tagId: 't-1', tagName: 'dev' },
		])

		const res = await app.handle(
			createRequest('/api/bookmarks', { query: { folderId: 'f-1' } }),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body[0].tags).toEqual([{ id: 't-1', name: 'dev' }])
	})
})

// ─── POST /api/bookmarks ─────────────────────────────────────────────

describe('POST /api/bookmarks', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(
			createRequest('/api/bookmarks', {
				method: 'POST',
				body: { url: 'https://example.com', title: 'Test' },
			}),
		)
		expect(res.status).toBe(401)
	})

	test('creates a bookmark', async () => {
		// insert bookmark
		dbResults.insert.push([BOOKMARK])
		// getBookmarkTags (no tags)
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/bookmarks', {
				method: 'POST',
				body: { url: 'https://example.com', title: 'Example' },
			}),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.id).toBe('bm-1')
		expect(body.tags).toEqual([])
	})

	test('returns 422 when body is invalid', async () => {
		const res = await app.handle(
			createRequest('/api/bookmarks', {
				method: 'POST',
				body: { description: 'missing url and title' },
			}),
		)
		expect(res.status).toBe(422)
	})

	test('returns 403 when viewer tries to create in a folder', async () => {
		// getFolderAccess → viewer
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'owner-id', depth: 0, access: 'viewer' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'owner-id' }] })

		const res = await app.handle(
			createRequest('/api/bookmarks', {
				method: 'POST',
				body: { url: 'https://x.com', title: 'X', folderId: 'f-1' },
			}),
		)
		expect(res.status).toBe(403)
	})

	test('creates a bookmark with tags', async () => {
		// insert bookmark
		dbResults.insert.push([BOOKMARK])
		// upsertTags → insert tags (onConflictDoNothing)
		dbResults.insert.push([])
		// upsertTags → select tag ids
		dbResults.select.push([{ id: 't-1' }])
		// syncBookmarkTags → select existing bookmark_tag
		dbResults.select.push([])
		// syncBookmarkTags → insert new bookmark_tag
		dbResults.insert.push([])
		// getBookmarkTags
		dbResults.select.push([
			{ bookmarkId: 'bm-1', tagId: 't-1', tagName: 'dev' },
		])

		const res = await app.handle(
			createRequest('/api/bookmarks', {
				method: 'POST',
				body: { url: 'https://example.com', title: 'Example', tags: ['dev'] },
			}),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.tags).toEqual([{ id: 't-1', name: 'dev' }])
	})
})

// ─── PATCH /api/bookmarks/:id ────────────────────────────────────────

describe('PATCH /api/bookmarks/:id', () => {
	test('returns 404 when bookmark not found', async () => {
		dbResults.select.push([]) // bookmark lookup

		const res = await app.handle(
			createRequest('/api/bookmarks/nonexistent', {
				method: 'PATCH',
				body: { title: 'New Title' },
			}),
		)
		expect(res.status).toBe(404)
	})

	test('returns 403 when not owner of non-folder bookmark', async () => {
		dbResults.select.push([{ ...BOOKMARK, userId: 'other-user' }])

		const res = await app.handle(
			createRequest('/api/bookmarks/bm-1', {
				method: 'PATCH',
				body: { title: 'New Title' },
			}),
		)
		expect(res.status).toBe(403)
	})

	test('updates a bookmark', async () => {
		const updated = { ...BOOKMARK, title: 'New Title' }
		// select bookmark
		dbResults.select.push([BOOKMARK])
		// update bookmark
		dbResults.update.push([updated])
		// getBookmarkTags
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/bookmarks/bm-1', {
				method: 'PATCH',
				body: { title: 'New Title' },
			}),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.title).toBe('New Title')
	})
})

// ─── DELETE /api/bookmarks/:id ───────────────────────────────────────

describe('DELETE /api/bookmarks/:id', () => {
	test('returns 404 when bookmark not found', async () => {
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/bookmarks/nonexistent', { method: 'DELETE' }),
		)
		expect(res.status).toBe(404)
	})

	test('returns 403 when not owner', async () => {
		dbResults.select.push([{ ...BOOKMARK, userId: 'other-user' }])

		const res = await app.handle(
			createRequest('/api/bookmarks/bm-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(403)
	})

	test('deletes a bookmark', async () => {
		dbResults.select.push([BOOKMARK])
		dbResults.delete.push([])

		const res = await app.handle(
			createRequest('/api/bookmarks/bm-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true })
	})
})

// ─── POST /api/bookmarks/bulk-delete ─────────────────────────────────

describe('POST /api/bookmarks/bulk-delete', () => {
	test('returns success for empty ids', async () => {
		const res = await app.handle(
			createRequest('/api/bookmarks/bulk-delete', {
				method: 'POST',
				body: { ids: [] },
			}),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true, deleted: 0 })
	})

	test('deletes multiple bookmarks', async () => {
		// lookup each bookmark
		dbResults.select.push([BOOKMARK])
		dbResults.select.push([{ ...BOOKMARK, id: 'bm-2' }])
		// delete each
		dbResults.delete.push([BOOKMARK])
		dbResults.delete.push([{ ...BOOKMARK, id: 'bm-2' }])

		const res = await app.handle(
			createRequest('/api/bookmarks/bulk-delete', {
				method: 'POST',
				body: { ids: ['bm-1', 'bm-2'] },
			}),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true, deleted: 2 })
	})
})

// ─── POST /api/bookmarks/bulk-move ───────────────────────────────────

describe('POST /api/bookmarks/bulk-move', () => {
	test('returns success for empty ids', async () => {
		const res = await app.handle(
			createRequest('/api/bookmarks/bulk-move', {
				method: 'POST',
				body: { ids: [], folderId: null },
			}),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true, moved: 0 })
	})

	test('returns 403 when no access to target folder', async () => {
		// getFolderAccess on target → no access
		dbResults.execute.push({ rows: [] })

		const res = await app.handle(
			createRequest('/api/bookmarks/bulk-move', {
				method: 'POST',
				body: { ids: ['bm-1'], folderId: 'f-1' },
			}),
		)
		expect(res.status).toBe(403)
	})
})

// ─── PUT /api/bookmarks/reorder ──────────────────────────────────────

describe('PUT /api/bookmarks/reorder', () => {
	test('reorders bookmarks', async () => {
		// update each item's position
		dbResults.update.push([])
		dbResults.update.push([])

		const res = await app.handle(
			createRequest('/api/bookmarks/reorder', {
				method: 'PUT',
				body: {
					items: [
						{ id: 'bm-1', position: 1 },
						{ id: 'bm-2', position: 0 },
					],
				},
			}),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true })
	})
})
