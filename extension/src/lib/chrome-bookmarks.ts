import { CHROME_ROOTS, IGNORED_URL_PREFIXES } from './constants'

export function isFolder(node: chrome.bookmarks.BookmarkTreeNode): boolean {
	return !node.url
}

export function isIgnoredUrl(url: string): boolean {
	return IGNORED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
}

export function isRootNode(id: string): boolean {
	return (
		id === '0' ||
		id === CHROME_ROOTS.BOOKMARKS_BAR ||
		id === CHROME_ROOTS.OTHER_BOOKMARKS
	)
}

export function isSyncableNode(
	node: chrome.bookmarks.BookmarkTreeNode,
): boolean {
	if (isRootNode(node.id)) return false
	if (node.url && isIgnoredUrl(node.url)) return false
	if (!node.url && !node.title) return false
	return true
}

export async function getFullTree(): Promise<
	chrome.bookmarks.BookmarkTreeNode[]
> {
	const tree = await chrome.bookmarks.getTree()
	const roots = tree[0]?.children ?? []
	return roots.filter((n) => n.id === CHROME_ROOTS.BOOKMARKS_BAR)
}

export async function getNode(
	id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
	try {
		const nodes = await chrome.bookmarks.get(id)
		return nodes[0] ?? null
	} catch {
		return null
	}
}

export async function getChildren(
	id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
	return chrome.bookmarks.getChildren(id)
}

export async function createFolder(
	parentId: string,
	title: string,
	index?: number,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
	return chrome.bookmarks.create({
		parentId,
		title,
		index,
	})
}

export async function createBookmark(
	parentId: string,
	title: string,
	url: string,
	index?: number,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
	return chrome.bookmarks.create({
		parentId,
		title,
		url,
		index,
	})
}

export async function updateNode(
	id: string,
	changes: { title?: string; url?: string },
): Promise<chrome.bookmarks.BookmarkTreeNode> {
	return chrome.bookmarks.update(id, changes)
}

export async function moveNode(
	id: string,
	destination: { parentId?: string; index?: number },
): Promise<chrome.bookmarks.BookmarkTreeNode> {
	return chrome.bookmarks.move(id, destination)
}

export async function removeNode(id: string): Promise<void> {
	try {
		await chrome.bookmarks.remove(id)
	} catch {
		await chrome.bookmarks.removeTree(id)
	}
}

export function getFaviconUrl(url: string): string | null {
	try {
		const domain = new URL(url).hostname
		return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
	} catch {
		return null
	}
}

export type FlatNode = {
	id: string
	parentId: string
	title: string
	url?: string
	index: number
	isFolder: boolean
}

export function flattenTree(
	nodes: chrome.bookmarks.BookmarkTreeNode[],
	parentId = '0',
): FlatNode[] {
	const result: FlatNode[] = []

	for (const node of nodes) {
		if (!isSyncableNode(node) && !isRootNode(node.id)) continue

		result.push({
			id: node.id,
			parentId: node.parentId ?? parentId,
			title: node.title,
			url: node.url,
			index: node.index ?? 0,
			isFolder: isFolder(node),
		})

		if (node.children) {
			result.push(...flattenTree(node.children, node.id))
		}
	}

	return result
}
