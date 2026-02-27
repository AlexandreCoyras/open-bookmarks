import type {
	ChromeChange,
	OBBookmark,
	OBFolder,
	SyncSnapshot,
	SyncStats,
	SyncStatus,
} from '../types'
import { ApiError, api } from './api'
import {
	createBookmark as chromeCreateBookmark,
	createFolder as chromeCreateFolder,
	flattenTree,
	getFaviconUrl,
	getFullTree,
	isFolder,
	isIgnoredUrl,
	isRootNode,
	isSyncableNode,
	moveNode,
	removeNode,
	updateNode,
} from './chrome-bookmarks'
import { resolveConflict } from './conflict'
import {
	ALARM_NAME,
	CHROME_ROOTS,
	DEBOUNCE_MS,
	POLL_INTERVAL_MINUTES,
	STORAGE_KEYS,
} from './constants'
import { idMap } from './id-map'
import { logger } from './logger'
import {
	diffBookmarks,
	diffFolders,
	loadSnapshot,
	saveSnapshot,
} from './snapshot'

export class SyncEngine {
	private status: SyncStatus = 'idle'
	private syncEnabled = false
	private syncingFromOB = false
	private lastSyncTime: string | null = null
	private bookmarkCount = 0
	private folderCount = 0

	private changeQueue: ChromeChange[] = []
	private debounceTimer: ReturnType<typeof setTimeout> | null = null

	async init(): Promise<void> {
		await idMap.load()

		const result = await chrome.storage.local.get([
			STORAGE_KEYS.syncEnabled,
			STORAGE_KEYS.lastSyncTime,
		])
		this.syncEnabled = result[STORAGE_KEYS.syncEnabled] ?? false
		this.lastSyncTime = result[STORAGE_KEYS.lastSyncTime] ?? null

		const authenticated = await api.isAuthenticated()
		if (!authenticated) {
			this.status = 'unauthenticated'
			this.updateBadge()
			return
		}

		if (this.syncEnabled) {
			this.startPolling()
		}

		this.updateBadge()
		logger.info('Sync engine initialized', {
			enabled: this.syncEnabled,
			mappings: idMap.size,
		})
	}

	// --- Chrome → OB event handlers ---

	onChromeCreated(id: string, node: chrome.bookmarks.BookmarkTreeNode): void {
		if (this.syncingFromOB || !this.syncEnabled) return
		if (!isSyncableNode(node)) return

		this.changeQueue.push({
			action: 'created',
			nodeType: isFolder(node) ? 'folder' : 'bookmark',
			chromeId: id,
			node,
		})
		this.scheduleProcessQueue()
	}

	onChromeRemoved(
		id: string,
		removeInfo: chrome.bookmarks.BookmarkRemoveInfo,
	): void {
		if (this.syncingFromOB || !this.syncEnabled) return
		if (!idMap.has(id)) return

		this.changeQueue.push({
			action: 'removed',
			chromeId: id,
			parentId: removeInfo.parentId,
		})
		this.scheduleProcessQueue()
	}

	onChromeChanged(
		id: string,
		changeInfo: chrome.bookmarks.BookmarkChangeInfo,
	): void {
		if (this.syncingFromOB || !this.syncEnabled) return
		if (!idMap.has(id)) return

		this.changeQueue.push({
			action: 'changed',
			chromeId: id,
			changes: changeInfo,
		})
		this.scheduleProcessQueue()
	}

	onChromeMoved(id: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo): void {
		if (this.syncingFromOB || !this.syncEnabled) return
		if (!idMap.has(id)) return

		this.changeQueue.push({
			action: 'moved',
			chromeId: id,
			newParentId: moveInfo.parentId,
			newIndex: moveInfo.index,
		})
		this.scheduleProcessQueue()
	}

	// --- Queue processing ---

	private scheduleProcessQueue(): void {
		if (this.debounceTimer) clearTimeout(this.debounceTimer)
		this.debounceTimer = setTimeout(() => {
			this.processQueue()
			this.debounceTimer = null
		}, DEBOUNCE_MS)
	}

	private async processQueue(): Promise<void> {
		if (this.changeQueue.length === 0) return

		const changes = [...this.changeQueue]
		this.changeQueue = []

		this.setStatus('syncing')

		const failed: ChromeChange[] = []

		for (const change of changes) {
			try {
				await this.processChromeChange(change)
			} catch (error) {
				if (error instanceof ApiError && error.status === 401) {
					this.setStatus('unauthenticated')
					const idx = changes.indexOf(change)
					this.changeQueue.unshift(...changes.slice(idx), ...failed)
					return
				}
				logger.error('Failed to process Chrome change:', change, error)
				failed.push(change)
			}
		}

		await idMap.save()

		if (failed.length > 0) {
			this.changeQueue.unshift(...failed)
		}

		if (failed.length < changes.length) {
			this.lastSyncTime = new Date().toISOString()
			await chrome.storage.local.set({
				[STORAGE_KEYS.lastSyncTime]: this.lastSyncTime,
			})
		}

		this.setStatus(failed.length === changes.length ? 'error' : 'idle')
	}

	private async processChromeChange(change: ChromeChange): Promise<void> {
		const now = new Date().toISOString()

		switch (change.action) {
			case 'created': {
				const parentMapping = idMap.getByChrome(change.node.parentId ?? '')
				const obParentId =
					!parentMapping || parentMapping.obId === 'ROOT'
						? null
						: parentMapping.obId

				if (change.nodeType === 'folder') {
					const created = await api.createFolder({
						name: change.node.title,
						parentId: obParentId,
						position: change.node.index ?? 0,
					})
					idMap.set(change.chromeId, created.id, 'folder', now)
					logger.info(`Folder synced Chrome→OB: "${change.node.title}"`)
				} else {
					const url = change.node.url!
					const created = await api.createBookmark({
						url,
						title: change.node.title,
						favicon: getFaviconUrl(url),
						folderId: obParentId,
						position: change.node.index ?? 0,
					})
					idMap.set(change.chromeId, created.id, 'bookmark', now)
					logger.info(`Bookmark synced Chrome→OB: "${change.node.title}"`)
				}
				break
			}

			case 'removed': {
				const mapping = idMap.getByChrome(change.chromeId)
				if (!mapping || mapping.isRoot) break

				try {
					if (mapping.type === 'folder') {
						await api.deleteFolder(mapping.obId)
					} else {
						await api.deleteBookmark(mapping.obId)
					}
				} catch (error) {
					if (error instanceof ApiError && error.status === 404) {
						logger.debug('Already deleted on OB side:', mapping.obId)
					} else {
						throw error
					}
				}
				idMap.removeByChrome(change.chromeId)
				logger.info(`Removed synced Chrome→OB: ${mapping.type} ${mapping.obId}`)
				break
			}

			case 'changed': {
				const mapping = idMap.getByChrome(change.chromeId)
				if (!mapping || mapping.isRoot) break

				if (mapping.type === 'bookmark') {
					await api.updateBookmark(mapping.obId, {
						title: change.changes.title,
						url: change.changes.url,
					})
				} else {
					await api.updateFolder(mapping.obId, {
						name: change.changes.title,
					})
				}
				idMap.set(
					change.chromeId,
					mapping.obId,
					mapping.type,
					now,
					mapping.isRoot,
				)
				logger.info(`Updated synced Chrome→OB: ${mapping.type}`)
				break
			}

			case 'moved': {
				const mapping = idMap.getByChrome(change.chromeId)
				if (!mapping || mapping.isRoot) break

				const parentMapping = idMap.getByChrome(change.newParentId)
				const obParentId =
					!parentMapping || parentMapping.obId === 'ROOT'
						? null
						: parentMapping.obId

				if (mapping.type === 'bookmark') {
					await api.updateBookmark(mapping.obId, {
						folderId: obParentId,
						position: change.newIndex,
					})
				} else {
					await api.updateFolder(mapping.obId, {
						parentId: obParentId,
						position: change.newIndex,
					})
				}
				idMap.set(
					change.chromeId,
					mapping.obId,
					mapping.type,
					now,
					mapping.isRoot,
				)
				logger.info(`Moved synced Chrome→OB: ${mapping.type}`)
				break
			}
		}
	}

	// --- OB → Chrome polling ---

	async pollOB(): Promise<void> {
		if (!this.syncEnabled) return

		const authenticated = await api.isAuthenticated()
		if (!authenticated) {
			this.setStatus('unauthenticated')
			return
		}

		this.setStatus('syncing')

		try {
			const snapshot = await api.getSnapshot()
			const previous = await loadSnapshot()

			if (previous) {
				await this.applyOBChanges(previous, snapshot)
			} else {
				await this.initialSync(snapshot)
			}

			await saveSnapshot(snapshot)
			this.bookmarkCount = snapshot.bookmarks.length
			this.folderCount = snapshot.folders.length
			this.lastSyncTime = new Date().toISOString()
			await chrome.storage.local.set({
				[STORAGE_KEYS.lastSyncTime]: this.lastSyncTime,
			})

			this.setStatus('idle')
			logger.info('OB poll complete', {
				folders: snapshot.folders.length,
				bookmarks: snapshot.bookmarks.length,
			})
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				this.setStatus('unauthenticated')
			} else {
				this.setStatus('error')
				logger.error('OB poll failed:', error)
			}
		}
	}

	private async applyOBChanges(
		previous: SyncSnapshot,
		current: SyncSnapshot,
	): Promise<void> {
		const folderDiff = diffFolders(previous.folders, current.folders)
		const bookmarkDiff = diffBookmarks(previous.bookmarks, current.bookmarks)

		const hasChanges =
			folderDiff.added.length > 0 ||
			folderDiff.removed.length > 0 ||
			folderDiff.modified.length > 0 ||
			bookmarkDiff.added.length > 0 ||
			bookmarkDiff.removed.length > 0 ||
			bookmarkDiff.modified.length > 0

		if (!hasChanges) {
			logger.debug('No OB changes detected')
			return
		}

		this.syncingFromOB = true

		try {
			// Process folders first (parents before children, topologically sorted)
			for (const folder of this.topoSortFolders(folderDiff.added)) {
				if (idMap.hasOB(folder.id)) continue
				await this.createChromeFolder(folder)
			}

			for (const folder of folderDiff.modified) {
				const mapping = idMap.getByOB(folder.id)
				if (!mapping) continue

				const conflict = resolveConflict(mapping, folder.updatedAt)
				if (conflict === 'chrome') continue

				await this.updateChromeFolder(mapping.chromeId, folder)
				idMap.set(mapping.chromeId, folder.id, 'folder', folder.updatedAt)
			}

			for (const folder of folderDiff.removed) {
				const mapping = idMap.getByOB(folder.id)
				if (!mapping || mapping.isRoot) continue

				try {
					await removeNode(mapping.chromeId)
				} catch {
					logger.debug('Chrome node already removed:', mapping.chromeId)
				}
				idMap.removeByOB(folder.id)
			}

			// Process bookmarks
			for (const bm of bookmarkDiff.added) {
				if (idMap.hasOB(bm.id)) continue
				if (bm.url && isIgnoredUrl(bm.url)) continue
				await this.createChromeBookmark(bm)
			}

			for (const bm of bookmarkDiff.modified) {
				const mapping = idMap.getByOB(bm.id)
				if (!mapping) continue

				const conflict = resolveConflict(mapping, bm.updatedAt)
				if (conflict === 'chrome') continue

				await this.updateChromeBookmark(mapping.chromeId, bm)
				idMap.set(mapping.chromeId, bm.id, 'bookmark', bm.updatedAt)
			}

			for (const bm of bookmarkDiff.removed) {
				const mapping = idMap.getByOB(bm.id)
				if (!mapping) continue

				try {
					await removeNode(mapping.chromeId)
				} catch {
					logger.debug('Chrome node already removed:', mapping.chromeId)
				}
				idMap.removeByOB(bm.id)
			}

			await idMap.save()
		} finally {
			this.syncingFromOB = false
		}
	}

	private async createChromeFolder(folder: OBFolder): Promise<void> {
		const parentChromeId = this.resolveChromeParentId(folder.parentId)
		try {
			const node = await chromeCreateFolder(
				parentChromeId,
				folder.name,
				folder.position,
			)
			idMap.set(node.id, folder.id, 'folder', folder.updatedAt)
			logger.info(`Folder synced OB→Chrome: "${folder.name}"`)
		} catch (error) {
			logger.error(`Failed to create Chrome folder "${folder.name}":`, error)
		}
	}

	private async updateChromeFolder(
		chromeId: string,
		folder: OBFolder,
	): Promise<void> {
		if (isRootNode(chromeId)) return

		try {
			await updateNode(chromeId, { title: folder.name })

			const parentChromeId = this.resolveChromeParentId(folder.parentId)
			await moveNode(chromeId, {
				parentId: parentChromeId,
				index: folder.position,
			})
		} catch (error) {
			logger.error(`Failed to update Chrome folder "${folder.name}":`, error)
		}
	}

	private async createChromeBookmark(bm: OBBookmark): Promise<void> {
		const parentChromeId = this.resolveChromeParentId(bm.folderId)
		try {
			const node = await chromeCreateBookmark(
				parentChromeId,
				bm.title,
				bm.url,
				bm.position,
			)
			idMap.set(node.id, bm.id, 'bookmark', bm.updatedAt)
			logger.info(`Bookmark synced OB→Chrome: "${bm.title}"`)
		} catch (error) {
			logger.error(`Failed to create Chrome bookmark "${bm.title}":`, error)
		}
	}

	private async updateChromeBookmark(
		chromeId: string,
		bm: OBBookmark,
	): Promise<void> {
		try {
			await updateNode(chromeId, { title: bm.title, url: bm.url })

			const parentChromeId = this.resolveChromeParentId(bm.folderId)
			await moveNode(chromeId, {
				parentId: parentChromeId,
				index: bm.position,
			})
		} catch (error) {
			logger.error(`Failed to update Chrome bookmark "${bm.title}":`, error)
		}
	}

	private topoSortFolders(folders: OBFolder[]): OBFolder[] {
		const sorted: OBFolder[] = []
		const remaining = [...folders]
		const addedIds = new Set<string>()

		let prevLength = -1
		while (remaining.length > 0 && remaining.length !== prevLength) {
			prevLength = remaining.length
			for (let i = remaining.length - 1; i >= 0; i--) {
				const folder = remaining[i]
				const parentReady =
					!folder.parentId ||
					idMap.hasOB(folder.parentId) ||
					addedIds.has(folder.parentId)
				if (parentReady) {
					sorted.push(folder)
					addedIds.add(folder.id)
					remaining.splice(i, 1)
				}
			}
		}

		// Orphans fallback to Bookmarks Bar via resolveChromeParentId
		sorted.push(...remaining)
		return sorted
	}

	private resolveChromeParentId(obParentId: string | null): string {
		if (!obParentId) return CHROME_ROOTS.BOOKMARKS_BAR

		const mapping = idMap.getByOB(obParentId)
		if (mapping && mapping.obId !== 'ROOT') return mapping.chromeId

		return CHROME_ROOTS.BOOKMARKS_BAR
	}

	// --- Initial sync ---

	async initialSync(snapshot?: SyncSnapshot): Promise<void> {
		logger.info('Starting initial sync...')
		this.setStatus('syncing')
		this.syncingFromOB = true

		try {
			if (!snapshot) {
				snapshot = await api.getSnapshot()
			}

			const chromeTree = await getFullTree()

			// Map Chrome root folders to OB
			this.mapRootFolders()

			// Match existing items by URL/name
			const chromeNodes = flattenTree(chromeTree)
			const obBookmarksByUrl = new Map(
				snapshot.bookmarks.map((b) => [b.url, b]),
			)
			const obFoldersByKey = new Map(
				snapshot.folders.map((f) => [`${f.name}::${f.parentId ?? 'root'}`, f]),
			)

			// Sync Chrome folders to OB
			const chromeFolders = chromeNodes.filter(
				(n) => n.isFolder && !isRootNode(n.id),
			)
			for (const node of chromeFolders) {
				if (idMap.has(node.id)) continue

				const parentMapping = idMap.getByChrome(node.parentId)
				const obParent =
					!parentMapping || parentMapping.obId === 'ROOT'
						? null
						: parentMapping.obId
				const obParentKey = `${node.title}::${obParent ?? 'root'}`
				const existingOB = obFoldersByKey.get(obParentKey)

				if (existingOB) {
					idMap.set(node.id, existingOB.id, 'folder', existingOB.updatedAt)
					obFoldersByKey.delete(obParentKey)
				} else {
					const created = await api.createFolder({
						name: node.title,
						parentId: obParent,
						position: node.index,
					})
					idMap.set(node.id, created.id, 'folder', new Date().toISOString())
				}
			}

			// Sync Chrome bookmarks to OB
			const chromeBookmarks = chromeNodes.filter(
				(n) => !n.isFolder && n.url && !isIgnoredUrl(n.url),
			)
			for (const node of chromeBookmarks) {
				if (idMap.has(node.id)) continue

				const existingOB = obBookmarksByUrl.get(node.url!)
				if (existingOB) {
					idMap.set(node.id, existingOB.id, 'bookmark', existingOB.updatedAt)
					obBookmarksByUrl.delete(node.url!)
				} else {
					const parentOb = idMap.getByChrome(node.parentId)
					const folderId =
						parentOb && parentOb.obId !== 'ROOT' ? parentOb.obId : null
					const created = await api.createBookmark({
						url: node.url!,
						title: node.title,
						favicon: getFaviconUrl(node.url!),
						folderId,
						position: node.index,
					})
					idMap.set(node.id, created.id, 'bookmark', new Date().toISOString())
				}
			}

			// Sync remaining OB items to Chrome (those not matched)
			for (const folder of snapshot.folders) {
				if (idMap.hasOB(folder.id)) continue
				await this.createChromeFolder(folder)
			}

			for (const bm of snapshot.bookmarks) {
				if (idMap.hasOB(bm.id)) continue
				if (isIgnoredUrl(bm.url)) continue
				await this.createChromeBookmark(bm)
			}

			await idMap.save()
			await saveSnapshot(snapshot)

			this.bookmarkCount = snapshot.bookmarks.length
			this.folderCount = snapshot.folders.length
			this.lastSyncTime = new Date().toISOString()
			await chrome.storage.local.set({
				[STORAGE_KEYS.lastSyncTime]: this.lastSyncTime,
			})

			logger.info('Initial sync complete', {
				mappings: idMap.size,
				obFolders: snapshot.folders.length,
				obBookmarks: snapshot.bookmarks.length,
			})

			this.setStatus('idle')
		} catch (error) {
			logger.error('Initial sync failed:', error)
			this.setStatus('error')
		} finally {
			this.syncingFromOB = false
		}
	}

	private mapRootFolders(): void {
		// Only the Bookmarks Bar maps to OB root (parentId: null)
		if (!idMap.has(CHROME_ROOTS.BOOKMARKS_BAR)) {
			idMap.set(
				CHROME_ROOTS.BOOKMARKS_BAR,
				'ROOT',
				'folder',
				new Date().toISOString(),
				true,
			)
		}
	}

	// --- Polling management ---

	startPolling(): void {
		chrome.alarms.create(ALARM_NAME, {
			periodInMinutes: POLL_INTERVAL_MINUTES,
		})
		logger.info(`Polling started (every ${POLL_INTERVAL_MINUTES} min)`)
	}

	stopPolling(): void {
		chrome.alarms.clear(ALARM_NAME)
		logger.info('Polling stopped')
	}

	// --- Enable/disable ---

	async setEnabled(enabled: boolean): Promise<void> {
		this.syncEnabled = enabled
		await chrome.storage.local.set({
			[STORAGE_KEYS.syncEnabled]: enabled,
		})

		if (enabled) {
			const authenticated = await api.isAuthenticated()
			if (!authenticated) {
				this.setStatus('unauthenticated')
				return
			}

			this.startPolling()

			if (idMap.size === 0) {
				await this.initialSync()
			} else {
				await this.pollOB()
			}
		} else {
			this.stopPolling()
			this.setStatus('idle')
		}
	}

	// --- Status ---

	private setStatus(status: SyncStatus): void {
		this.status = status
		this.updateBadge()
	}

	private updateBadge(): void {
		const badgeConfig: Record<SyncStatus, { text: string; color: string }> = {
			idle: { text: '', color: '#22c55e' },
			syncing: { text: '...', color: '#eab308' },
			error: { text: '!', color: '#ef4444' },
			unauthenticated: { text: '?', color: '#ef4444' },
		}

		const { text, color } = badgeConfig[this.status]
		chrome.action.setBadgeText({ text })
		chrome.action.setBadgeBackgroundColor({ color })
	}

	getStatus(): SyncStats {
		return {
			status: this.status,
			lastSyncTime: this.lastSyncTime,
			syncEnabled: this.syncEnabled,
			bookmarkCount: this.bookmarkCount,
			folderCount: this.folderCount,
		}
	}
}
