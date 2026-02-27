import type { OBBookmark, OBFolder, SyncSnapshot } from '../types'
import { STORAGE_KEYS } from './constants'
import { logger } from './logger'

export type DiffResult<T> = {
	added: T[]
	removed: T[]
	modified: T[]
}

function diffById<T extends { id: string; updatedAt: string }>(
	previous: T[],
	current: T[],
): DiffResult<T> {
	const prevMap = new Map(previous.map((item) => [item.id, item]))
	const currMap = new Map(current.map((item) => [item.id, item]))

	const added: T[] = []
	const removed: T[] = []
	const modified: T[] = []

	for (const [id, item] of currMap) {
		const prev = prevMap.get(id)
		if (!prev) {
			added.push(item)
		} else if (item.updatedAt !== prev.updatedAt) {
			modified.push(item)
		}
	}

	for (const [id, item] of prevMap) {
		if (!currMap.has(id)) {
			removed.push(item)
		}
	}

	return { added, removed, modified }
}

export function diffFolders(
	previous: OBFolder[],
	current: OBFolder[],
): DiffResult<OBFolder> {
	return diffById(previous, current)
}

export function diffBookmarks(
	previous: OBBookmark[],
	current: OBBookmark[],
): DiffResult<OBBookmark> {
	return diffById(previous, current)
}

export async function loadSnapshot(): Promise<SyncSnapshot | null> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.lastSnapshot)
	return (result[STORAGE_KEYS.lastSnapshot] as SyncSnapshot) ?? null
}

export async function saveSnapshot(snapshot: SyncSnapshot): Promise<void> {
	await chrome.storage.local.set({
		[STORAGE_KEYS.lastSnapshot]: snapshot,
	})
	logger.debug(
		`Snapshot saved: ${snapshot.folders.length} folders, ${snapshot.bookmarks.length} bookmarks`,
	)
}
