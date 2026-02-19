import { beforeEach, describe, expect, test } from 'bun:test'
import app from '@/server/app'
import { clearMockSession, restoreMockSession } from '../helpers/mock-auth'
import { dbResults, resetDbMocks } from '../helpers/mock-db'
import { createRequest } from '../helpers/request'

const VALID_HTML = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
	<DT><H3>Dev</H3>
	<DL><p>
		<DT><A HREF="https://example.com">Example</A>
	</DL><p>
</DL><p>
`

beforeEach(() => {
	resetDbMocks()
	restoreMockSession()
})

describe('POST /api/import/bookmarks', () => {
	test('returns 401 without auth', async () => {
		clearMockSession()
		const res = await app.handle(
			createRequest('/api/import/bookmarks', {
				method: 'POST',
				body: { html: VALID_HTML },
			}),
		)
		expect(res.status).toBe(401)
	})

	test('imports bookmarks from HTML', async () => {
		// insertInChunks → insert folders
		dbResults.insert.push([])
		// insertInChunks → insert bookmarks
		dbResults.insert.push([])

		const res = await app.handle(
			createRequest('/api/import/bookmarks', {
				method: 'POST',
				body: { html: VALID_HTML },
			}),
		)
		expect(res.status).toBe(200)

		const body = await res.json()
		expect(body.foldersCreated).toBeGreaterThan(0)
		expect(body.bookmarksCreated).toBeGreaterThan(0)
	})

	test('returns 400 for empty bookmark file', async () => {
		const emptyHtml = `
			<!DOCTYPE NETSCAPE-Bookmark-file-1>
			<TITLE>Bookmarks</TITLE>
			<H1>Bookmarks</H1>
			<DL><p></DL><p>
		`

		const res = await app.handle(
			createRequest('/api/import/bookmarks', {
				method: 'POST',
				body: { html: emptyHtml },
			}),
		)
		expect(res.status).toBe(400)
	})
})
