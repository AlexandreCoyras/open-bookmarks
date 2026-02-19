import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

// ─── GET /api/collaborators/folders/:folderId ────────────────────────

describe('GET /api/collaborators/folders/:folderId', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1'),
		)
		expect(res.status).toBe(401)
	})

	test('returns 403 when not owner', async () => {
		// folder lookup → different userId
		dbResults.select.push([{ userId: 'other-user' }])

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1'),
		)
		expect(res.status).toBe(403)
	})

	test('returns collaborators list', async () => {
		// folder lookup → owner
		dbResults.select.push([{ userId: 'test-user-id' }])
		// collaborators list
		dbResults.select.push([
			{
				id: 'collab-1',
				role: 'editor',
				createdAt: new Date('2024-01-01'),
				user: { id: 'u-2', name: 'Bob', email: 'bob@test.com', image: null },
			},
		])

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1'),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(1)
		expect(body[0].role).toBe('editor')
	})
})

// ─── POST /api/collaborators/folders/:folderId ───────────────────────

describe('POST /api/collaborators/folders/:folderId', () => {
	test('returns 403 when not owner', async () => {
		dbResults.select.push([{ userId: 'other-user' }])

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1', {
				method: 'POST',
				body: { email: 'bob@test.com', role: 'editor' },
			}),
		)
		expect(res.status).toBe(403)
	})

	test('returns 404 when target user not found', async () => {
		dbResults.select.push([{ userId: 'test-user-id' }]) // folder ownership
		dbResults.select.push([]) // user not found

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1', {
				method: 'POST',
				body: { email: 'unknown@test.com', role: 'viewer' },
			}),
		)
		expect(res.status).toBe(404)
	})

	test('returns 400 when trying to invite yourself', async () => {
		dbResults.select.push([{ userId: 'test-user-id' }])
		dbResults.select.push([
			{
				id: 'test-user-id',
				name: 'Test User',
				email: 'test@example.com',
				image: null,
			},
		])

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1', {
				method: 'POST',
				body: { email: 'test@example.com', role: 'editor' },
			}),
		)
		expect(res.status).toBe(400)
	})

	test('returns 409 when collaborator already exists', async () => {
		dbResults.select.push([{ userId: 'test-user-id' }])
		dbResults.select.push([
			{ id: 'u-2', name: 'Bob', email: 'bob@test.com', image: null },
		])
		// existing collaborator check
		dbResults.select.push([{ id: 'collab-1' }])

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1', {
				method: 'POST',
				body: { email: 'bob@test.com', role: 'editor' },
			}),
		)
		expect(res.status).toBe(409)
	})

	test('creates a collaborator', async () => {
		dbResults.select.push([{ userId: 'test-user-id' }])
		dbResults.select.push([
			{ id: 'u-2', name: 'Bob', email: 'bob@test.com', image: null },
		])
		dbResults.select.push([]) // no existing collab
		dbResults.insert.push([
			{
				id: 'collab-1',
				folderId: 'f-1',
				userId: 'u-2',
				role: 'editor',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			},
		])

		const res = await app.handle(
			createRequest('/api/collaborators/folders/f-1', {
				method: 'POST',
				body: { email: 'bob@test.com', role: 'editor' },
			}),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.role).toBe('editor')
		expect(body.user.name).toBe('Bob')
	})
})

// ─── PATCH /api/collaborators/:id ────────────────────────────────────

describe('PATCH /api/collaborators/:id', () => {
	test('returns 404 when collaborator not found', async () => {
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/collaborators/collab-1', {
				method: 'PATCH',
				body: { role: 'viewer' },
			}),
		)
		expect(res.status).toBe(404)
	})

	test('returns 403 when not folder owner', async () => {
		dbResults.select.push([{ id: 'collab-1', folderId: 'f-1' }])
		dbResults.select.push([{ userId: 'other-user' }])

		const res = await app.handle(
			createRequest('/api/collaborators/collab-1', {
				method: 'PATCH',
				body: { role: 'viewer' },
			}),
		)
		expect(res.status).toBe(403)
	})

	test('updates collaborator role', async () => {
		dbResults.select.push([{ id: 'collab-1', folderId: 'f-1' }])
		dbResults.select.push([{ userId: 'test-user-id' }])
		dbResults.update.push([
			{
				id: 'collab-1',
				folderId: 'f-1',
				userId: 'u-2',
				role: 'viewer',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			},
		])

		const res = await app.handle(
			createRequest('/api/collaborators/collab-1', {
				method: 'PATCH',
				body: { role: 'viewer' },
			}),
		)
		expect(res.status).toBe(200)
		expect((await res.json()).role).toBe('viewer')
	})
})

// ─── DELETE /api/collaborators/:id ───────────────────────────────────

describe('DELETE /api/collaborators/:id', () => {
	test('returns 404 when collaborator not found', async () => {
		dbResults.select.push([])

		const res = await app.handle(
			createRequest('/api/collaborators/collab-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(404)
	})

	test('returns 403 when not folder owner', async () => {
		dbResults.select.push([{ id: 'collab-1', folderId: 'f-1' }])
		dbResults.select.push([{ userId: 'other-user' }])

		const res = await app.handle(
			createRequest('/api/collaborators/collab-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(403)
	})

	test('deletes a collaborator', async () => {
		dbResults.select.push([{ id: 'collab-1', folderId: 'f-1' }])
		dbResults.select.push([{ userId: 'test-user-id' }])
		dbResults.delete.push([])

		const res = await app.handle(
			createRequest('/api/collaborators/collab-1', { method: 'DELETE' }),
		)
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true })
	})
})

// ─── GET /api/collaborators/shared-with-me ───────────────────────────

describe('GET /api/collaborators/shared-with-me', () => {
	test('returns shared folders', async () => {
		dbResults.select.push([
			{
				id: 'collab-1',
				role: 'editor',
				folder: { id: 'f-1', name: 'Shared', color: null, icon: null },
				owner: { id: 'u-owner', name: 'Alice', image: null },
			},
		])

		const res = await app.handle(
			createRequest('/api/collaborators/shared-with-me'),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body).toHaveLength(1)
		expect(body[0].folder.name).toBe('Shared')
	})
})
