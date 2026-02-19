import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

const FOLDER = {
	id: 'f-1',
	name: 'Dev',
	color: '#ff0000',
	icon: null,
	parentId: null,
	userId: 'test-user-id',
	position: 0,
	publicSlug: null,
	viewCount: 0,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
}

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

// ─── GET /api/folders ────────────────────────────────────────────────

describe('GET /api/folders', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(createRequest('/api/folders'))
		expect(res.status).toBe(401)
	})

	test('returns root folders', async () => {
		// select folders
		dbResults.select.push([FOLDER])
		// enrichWithCollaborators → select folderCollaborator
		dbResults.select.push([])

		const res = await app.handle(createRequest('/api/folders'))
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(1)
		expect(body[0].name).toBe('Dev')
		expect(body[0].hasCollaborators).toBe(false)
	})

	test('returns all folders when ?all=true', async () => {
		dbResults.select.push([FOLDER, { ...FOLDER, id: 'f-2', name: 'Work' }])
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/folders', { query: { all: 'true' } }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toHaveLength(2)
	})

	test('returns subfolders with access check', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// select subfolders
		dbResults.select.push([
			{ ...FOLDER, id: 'f-2', parentId: 'f-1', name: 'Sub' },
		])
		// enrichWithCollaborators
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/folders', { query: { parentId: 'f-1' } }),
		)
		expect(res.status).toBe(200)
		expect((await res.json())[0].name).toBe('Sub')
	})
})

// ─── GET /api/folders/check-slug ─────────────────────────────────────

describe('GET /api/folders/check-slug', () => {
	test('returns available=true when slug not taken', async () => {
		dbResults.select.push([]) // no existing folder with slug

		const res = await app.handle(
			createRequest('/api/folders/check-slug', { query: { slug: 'my-slug' } }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ available: true })
	})

	test('returns available=false when slug taken', async () => {
		dbResults.select.push([{ id: 'f-other' }])

		const res = await app.handle(
			createRequest('/api/folders/check-slug', { query: { slug: 'taken' } }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ available: false })
	})
})

// ─── GET /api/folders/:id ────────────────────────────────────────────

describe('GET /api/folders/:id', () => {
	test('returns 404 when no access', async () => {
		dbResults.execute.push({ rows: [] }) // getFolderAccess → no match

		const res = await app.handle(createRequest('/api/folders/f-nonexistent'))
		expect(res.status).toBe(404)
	})

	test('returns folder with access info', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// select folder
		dbResults.select.push([FOLDER])
		// check collaborators (owner)
		dbResults.select.push([])

		const res = await app.handle(createRequest('/api/folders/f-1'))
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.name).toBe('Dev')
		expect(body.access).toBe('owner')
		expect(body.hasCollaborators).toBe(false)
	})
})

// ─── GET /api/folders/:id/breadcrumb ─────────────────────────────────

describe('GET /api/folders/:id/breadcrumb', () => {
	test('returns empty array when no access', async () => {
		dbResults.execute.push({ rows: [] })

		const res = await app.handle(createRequest('/api/folders/f-1/breadcrumb'))
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual([])
	})

	test('returns breadcrumb trail for owner', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-2', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// breadcrumb CTE
		dbResults.execute.push({
			rows: [
				{
					id: 'f-1',
					name: 'Dev',
					parentId: null,
					color: '#ff0000',
					icon: null,
				},
				{ id: 'f-2', name: 'Sub', parentId: 'f-1', color: null, icon: null },
			],
		})

		const res = await app.handle(createRequest('/api/folders/f-2/breadcrumb'))
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(2)
		expect(body[0].name).toBe('Dev')
		expect(body[1].name).toBe('Sub')
	})
})

// ─── POST /api/folders ───────────────────────────────────────────────

describe('POST /api/folders', () => {
	test('creates a folder at root', async () => {
		dbResults.insert.push([FOLDER])

		const res = await app.handle(
			createRequest('/api/folders', {
				method: 'POST',
				body: { name: 'Dev', color: '#ff0000' },
			}),
		)
		expect(res.status).toBe(200)
		expect((await res.json()).name).toBe('Dev')
	})

	test('returns 403 when no access to parent folder', async () => {
		dbResults.execute.push({ rows: [] }) // getFolderAccess → no access

		const res = await app.handle(
			createRequest('/api/folders', {
				method: 'POST',
				body: { name: 'Sub', parentId: 'f-no-access' },
			}),
		)
		expect(res.status).toBe(403)
	})
})

// ─── PATCH /api/folders/:id ──────────────────────────────────────────

describe('PATCH /api/folders/:id', () => {
	test('returns 403 when no access', async () => {
		dbResults.execute.push({ rows: [] })

		const res = await app.handle(
			createRequest('/api/folders/f-1', {
				method: 'PATCH',
				body: { name: 'Renamed' },
			}),
		)
		expect(res.status).toBe(403)
	})

	test('updates folder name', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// update folder
		dbResults.update.push([{ ...FOLDER, name: 'Renamed' }])

		const res = await app.handle(
			createRequest('/api/folders/f-1', {
				method: 'PATCH',
				body: { name: 'Renamed' },
			}),
		)
		expect(res.status).toBe(200)
		expect((await res.json()).name).toBe('Renamed')
	})

	test('returns 422 for invalid publicSlug format', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })

		const res = await app.handle(
			createRequest('/api/folders/f-1', {
				method: 'PATCH',
				body: { publicSlug: 'A' }, // too short, invalid format
			}),
		)
		expect(res.status).toBe(422)
	})

	test('returns 409 for duplicate publicSlug', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// slug uniqueness check → found existing
		dbResults.select.push([{ id: 'f-other' }])

		const res = await app.handle(
			createRequest('/api/folders/f-1', {
				method: 'PATCH',
				body: { publicSlug: 'already-taken-slug' },
			}),
		)
		expect(res.status).toBe(409)
	})

	test('returns 403 when editor tries to set publicSlug', async () => {
		// getFolderAccess → editor
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'owner-id', depth: 0, access: 'editor' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'owner-id' }] })

		const res = await app.handle(
			createRequest('/api/folders/f-1', {
				method: 'PATCH',
				body: { publicSlug: 'new-slug-here' },
			}),
		)
		expect(res.status).toBe(403)
	})
})

// ─── DELETE /api/folders/:id ─────────────────────────────────────────

describe('DELETE /api/folders/:id', () => {
	test('returns 404 when no access', async () => {
		dbResults.execute.push({ rows: [] })

		const res = await app.handle(
			createRequest('/api/folders/f-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(404)
	})

	test('deletes a folder and its descendants', async () => {
		// getFolderAccess
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'test-user-id', depth: 0, access: 'owner' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'test-user-id' }] })
		// check direct collaborator → none
		dbResults.select.push([])
		// recursive tree CTE → descendants
		dbResults.execute.push({ rows: [{ id: 'f-1' }, { id: 'f-sub' }] })
		// delete bookmarks in those folders
		dbResults.execute.push({ rows: [] })
		// delete folders
		dbResults.execute.push({ rows: [] })

		const res = await app.handle(
			createRequest('/api/folders/f-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true })
	})

	test('returns 403 when non-owner tries to delete folder with collaborators', async () => {
		// getFolderAccess → editor
		dbResults.execute.push({
			rows: [
				{ folderId: 'f-1', ownerId: 'owner-id', depth: 0, access: 'editor' },
			],
		})
		dbResults.execute.push({ rows: [{ ownerId: 'owner-id' }] })
		// check direct collaborator → exists
		dbResults.select.push([{ id: 'collab-1' }])

		const res = await app.handle(
			createRequest('/api/folders/f-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(403)
	})
})

// ─── PUT /api/folders/reorder ────────────────────────────────────────

describe('PUT /api/folders/reorder', () => {
	test('reorders folders', async () => {
		dbResults.update.push([])
		dbResults.update.push([])

		const res = await app.handle(
			createRequest('/api/folders/reorder', {
				method: 'PUT',
				body: {
					items: [
						{ id: 'f-1', position: 1 },
						{ id: 'f-2', position: 0 },
					],
				},
			}),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true })
	})
})
