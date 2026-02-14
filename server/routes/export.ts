import { asc, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { bookmark, folder } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

type FolderRow = typeof folder.$inferSelect
type BookmarkRow = typeof bookmark.$inferSelect

type FolderNode = {
	folder: FolderRow
	children: FolderNode[]
	bookmarks: BookmarkRow[]
}

function buildTree(
	folders: FolderRow[],
	bookmarks: BookmarkRow[],
): { roots: FolderNode[]; rootBookmarks: BookmarkRow[] } {
	const folderMap = new Map<string, FolderNode>()

	for (const f of folders) {
		folderMap.set(f.id, { folder: f, children: [], bookmarks: [] })
	}

	const roots: FolderNode[] = []

	for (const f of folders) {
		const node = folderMap.get(f.id)!
		if (f.parentId && folderMap.has(f.parentId)) {
			folderMap.get(f.parentId)!.children.push(node)
		} else {
			roots.push(node)
		}
	}

	for (const node of folderMap.values()) {
		node.children.sort((a, b) => a.folder.position - b.folder.position)
	}
	roots.sort((a, b) => a.folder.position - b.folder.position)

	const rootBookmarks: BookmarkRow[] = []

	for (const b of bookmarks) {
		if (b.folderId && folderMap.has(b.folderId)) {
			folderMap.get(b.folderId)!.bookmarks.push(b)
		} else {
			rootBookmarks.push(b)
		}
	}

	for (const node of folderMap.values()) {
		node.bookmarks.sort((a, b) => a.position - b.position)
	}
	rootBookmarks.sort((a, b) => a.position - b.position)

	return { roots, rootBookmarks }
}

function encodeHtmlEntities(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function toUnixTimestamp(date: Date): number {
	return Math.floor(date.getTime() / 1000)
}

function renderBookmark(b: BookmarkRow, indent: string): string {
	const addDate = toUnixTimestamp(b.createdAt)
	const iconAttr = b.favicon ? ` ICON="${encodeHtmlEntities(b.favicon)}"` : ''
	const title = encodeHtmlEntities(b.title)
	const href = encodeHtmlEntities(b.url)
	return `${indent}<DT><A HREF="${href}" ADD_DATE="${addDate}"${iconAttr}>${title}</A>`
}

function renderFolder(node: FolderNode, indent: string): string {
	const lines: string[] = []
	const addDate = toUnixTimestamp(node.folder.createdAt)
	const lastModified = toUnixTimestamp(node.folder.updatedAt)
	const name = encodeHtmlEntities(node.folder.name)

	lines.push(
		`${indent}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${lastModified}">${name}</H3>`,
	)
	lines.push(`${indent}<DL><p>`)

	const childIndent = `${indent}    `

	for (const child of node.children) {
		lines.push(renderFolder(child, childIndent))
	}

	for (const b of node.bookmarks) {
		lines.push(renderBookmark(b, childIndent))
	}

	lines.push(`${indent}</DL><p>`)
	return lines.join('\n')
}

function renderNetscapeHtml(
	roots: FolderNode[],
	rootBookmarks: BookmarkRow[],
): string {
	const lines: string[] = [
		'<!DOCTYPE NETSCAPE-Bookmark-file-1>',
		'<!-- This is an automatically generated file.',
		'     It will be read and overwritten.',
		'     DO NOT EDIT! -->',
		'<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
		'<TITLE>Bookmarks</TITLE>',
		'<H1>Bookmarks</H1>',
		'<DL><p>',
	]

	for (const node of roots) {
		lines.push(renderFolder(node, '    '))
	}

	for (const b of rootBookmarks) {
		lines.push(renderBookmark(b, '    '))
	}

	lines.push('</DL><p>')

	return lines.join('\n')
}

export const exportRoutes = new Elysia({ prefix: '/export' })
	.use(authPlugin)
	.get(
		'/bookmarks',
		async ({ user, set }) => {
			const [allFolders, allBookmarks] = await Promise.all([
				db
					.select()
					.from(folder)
					.where(eq(folder.userId, user.id))
					.orderBy(asc(folder.position)),
				db
					.select()
					.from(bookmark)
					.where(eq(bookmark.userId, user.id))
					.orderBy(asc(bookmark.position)),
			])

			const { roots, rootBookmarks } = buildTree(allFolders, allBookmarks)
			const html = renderNetscapeHtml(roots, rootBookmarks)

			const today = new Date()
			const yyyy = today.getFullYear()
			const mm = String(today.getMonth() + 1).padStart(2, '0')
			const dd = String(today.getDate()).padStart(2, '0')
			const filename = `open-bookmarks-export-${yyyy}-${mm}-${dd}.html`

			set.headers['content-type'] = 'text/html; charset=utf-8'
			set.headers['content-disposition'] =
				`attachment; filename="${filename}"`

			return html
		},
		{
			auth: true,
		},
	)
