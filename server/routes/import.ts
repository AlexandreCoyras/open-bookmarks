import { Elysia, t } from 'elysia'
import { bookmark, folder } from '@/drizzle/schema'
import { db } from '@/lib/db'
import type { ParsedFolder } from '@/lib/import/parse-bookmarks-html'
import { parseBookmarksHtml } from '@/lib/import/parse-bookmarks-html'
import { authPlugin } from '@/server/auth-middleware'

const CHUNK_SIZE = 500

function getFaviconUrl(url: string): string | null {
	try {
		const domain = new URL(url).hostname
		return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
	} catch {
		return null
	}
}

type FlatFolder = {
	id: string
	name: string
	parentId: string | null
	userId: string
	position: number
}

type FlatBookmark = {
	id: string
	url: string
	title: string
	favicon: string | null
	folderId: string | null
	userId: string
	position: number
}

function flattenTree(
	tree: ParsedFolder,
	userId: string,
	parentId: string | null,
): { folders: FlatFolder[]; bookmarks: FlatBookmark[] } {
	const folders: FlatFolder[] = []
	const bookmarks: FlatBookmark[] = []

	function walk(
		node: ParsedFolder,
		currentParentId: string | null,
		folderPosition: number,
	) {
		const folderId = crypto.randomUUID()
		folders.push({
			id: folderId,
			name: node.name,
			parentId: currentParentId,
			userId,
			position: folderPosition,
		})

		for (let i = 0; i < node.bookmarks.length; i++) {
			const b = node.bookmarks[i]
			bookmarks.push({
				id: crypto.randomUUID(),
				url: b.url,
				title: b.title,
				favicon: getFaviconUrl(b.url),
				folderId,
				userId,
				position: i,
			})
		}

		for (let i = 0; i < node.children.length; i++) {
			walk(node.children[i], folderId, i)
		}
	}

	// The root wrapper folder
	const rootId = crypto.randomUUID()
	folders.push({
		id: rootId,
		name: tree.name,
		parentId,
		userId,
		position: 0,
	})

	// Root-level bookmarks go into the wrapper folder
	for (let i = 0; i < tree.bookmarks.length; i++) {
		const b = tree.bookmarks[i]
		bookmarks.push({
			id: crypto.randomUUID(),
			url: b.url,
			title: b.title,
			favicon: getFaviconUrl(b.url),
			folderId: rootId,
			userId,
			position: i,
		})
	}

	// Children of root
	for (let i = 0; i < tree.children.length; i++) {
		walk(tree.children[i], rootId, i)
	}

	return { folders, bookmarks }
}

async function insertInChunks<T extends Record<string, unknown>>(
	table: Parameters<typeof db.insert>[0],
	values: T[],
) {
	for (let i = 0; i < values.length; i += CHUNK_SIZE) {
		const chunk = values.slice(i, i + CHUNK_SIZE)
		await db.insert(table).values(chunk)
	}
}

export const importRoutes = new Elysia({ prefix: '/import' })
	.use(authPlugin)
	.post(
		'/bookmarks',
		async ({ user, body, status }) => {
			const tree = parseBookmarksHtml(body.html)

			const totalBookmarks =
				tree.bookmarks.length +
				tree.children.reduce(function countBookmarks(
					acc: number,
					f: ParsedFolder,
				): number {
					return acc + f.bookmarks.length + f.children.reduce(countBookmarks, 0)
				}, 0)

			if (totalBookmarks === 0 && tree.children.length === 0) {
				return status(400, {
					error: 'Aucun favori trouve dans le fichier',
				})
			}

			const now = new Date()
			const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

			tree.name = `Import Chrome - ${dateStr}`

			const { folders, bookmarks } = flattenTree(
				tree,
				user.id,
				body.folderId ?? null,
			)

			await insertInChunks(folder, folders)
			await insertInChunks(bookmark, bookmarks)

			return {
				foldersCreated: folders.length,
				bookmarksCreated: bookmarks.length,
			}
		},
		{
			auth: true,
			body: t.Object({
				html: t.String({ maxLength: 10 * 1024 * 1024 }),
				folderId: t.Optional(t.String()),
			}),
		},
	)
