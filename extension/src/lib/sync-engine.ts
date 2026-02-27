import type {
	ChromeChange,
	OBBookmark,
	OBFolder,
	SharedFolderMeta,
	SharedSyncSnapshot,
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
	SHARED_CONTAINER_NAME,
	SHARED_CONTAINER_OB_ID,
	STORAGE_KEYS,
} from './constants'
import { idMap } from './id-map'
import { logger } from './logger'
import {
	diffBookmarks,
	diffFolders,
	loadSharedSnapshot,
	loadSnapshot,
	saveSharedSnapshot,
	saveSnapshot,
} from './snapshot'

export class SyncEngine {
	private status: SyncStatus = 'idle'
	private syncEnabled = false
	private syncingFromOB = false
	private lastSyncTime: string | null = null
	private bookmarkCount = 0
	private folderCount = 0

	private sharedSyncEnabled = false
	private sharedBookmarkCount = 0
	private sharedFolderCount = 0

	private changeQueue: ChromeChange[] = []
	private debounceTimer: ReturnType<typeof setTimeout> | null = null

	async init(): Promise<void> {
		await idMap.load()

		const result = await chrome.storage.local.get([
			STORAGE_KEYS.syncEnabled,
			STORAGE_KEYS.lastSyncTime,
			STORAGE_KEYS.sharedSyncEnabled,
		])
		this.syncEnabled = result[STORAGE_KEYS.syncEnabled] ?? false
		this.lastSyncTime = result[STORAGE_KEYS.lastSyncTime] ?? null
		this.sharedSyncEnabled = result[STORAGE_KEYS.sharedSyncEnabled] ?? false

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
			sharedEnabled: this.sharedSyncEnabled,
			mappings: idMap.size,
		})
	}

	// --- Chrome → OB event handlers ---

	onChromeCreated(id: string, node: chrome.bookmarks.BookmarkTreeNode): void {
		if (this.syncingFromOB || !this.syncEnabled) return
		if (!isSyncableNode(node)) return

		// If parent is the shared container, ignore (no creating root shared folders from Chrome)
		const parentMapping = idMap.getByChrome(node.parentId ?? '')
		if (parentMapping?.obId === SHARED_CONTAINER_OB_ID) return

		// If parent is shared+viewer, ignore the change
		if (parentMapping?.shared && parentMapping.role === 'viewer') return

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

		// If item is shared+viewer, ignore
		const mapping = idMap.getByChrome(id)
		if (mapping?.shared && mapping.role === 'viewer') return

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

		// If item is shared+viewer, ignore
		if (idMap.isShared(id) && idMap.getRole(id) === 'viewer') return

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

		// If item is shared+viewer, ignore
		if (idMap.isShared(id) && idMap.getRole(id) === 'viewer') return

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
					!parentMapping ||
					parentMapping.obId === 'ROOT' ||
					parentMapping.isRoot ||
					isRootNode(change.node.parentId ?? '')
						? null
						: parentMapping.obId

				if (change.nodeType === 'folder') {
					const created = await api.createFolder({
						name: change.node.title,
						parentId: obParentId,
						position: change.node.index ?? 0,
					})
					// Inherit shared/role from parent
					const shared = parentMapping?.shared
					const role = parentMapping?.role
					idMap.set(
						change.chromeId,
						created.id,
						'folder',
						now,
						undefined,
						shared,
						role,
					)
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
					const shared = parentMapping?.shared
					const role = parentMapping?.role
					idMap.set(
						change.chromeId,
						created.id,
						'bookmark',
						now,
						undefined,
						shared,
						role,
					)
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
					mapping.shared,
					mapping.role,
				)
				logger.info(`Updated synced Chrome→OB: ${mapping.type}`)
				break
			}

			case 'moved': {
				const mapping = idMap.getByChrome(change.chromeId)
				if (!mapping || mapping.isRoot) break

				const parentMapping = idMap.getByChrome(change.newParentId)
				const obParentId =
					!parentMapping ||
					parentMapping.obId === 'ROOT' ||
					parentMapping.isRoot ||
					isRootNode(change.newParentId)
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
					mapping.shared,
					mapping.role,
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
			const pollStartTime = new Date().toISOString()
			const snapshot = await api.getSnapshot()
			const previous = await loadSnapshot()

			if (previous) {
				await this.applyOBChanges(previous, snapshot, pollStartTime)
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

		// Shared sync after main sync
		if (this.sharedSyncEnabled) {
			try {
				await this.pollSharedOB()
			} catch (error) {
				logger.error('Shared OB poll failed:', error)
			}
		}
	}

	private async applyOBChanges(
		previous: SyncSnapshot,
		current: SyncSnapshot,
		pollStartTime: string,
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
				idMap.set(
					mapping.chromeId,
					folder.id,
					'folder',
					folder.updatedAt,
					mapping.isRoot,
					mapping.shared,
					mapping.role,
				)
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
				idMap.set(
					mapping.chromeId,
					bm.id,
					'bookmark',
					bm.updatedAt,
					mapping.isRoot,
					mapping.shared,
					mapping.role,
				)
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

			// Reconcile orphaned entries: items in idMap but not on server
			// This catches items created from Chrome and deleted on server between polls
			if (this.changeQueue.length === 0 && !this.debounceTimer) {
				const serverBookmarkIds = new Set(
					current.bookmarks.map((b) => b.id),
				)
				const serverFolderIds = new Set(current.folders.map((f) => f.id))

				for (const entry of idMap.getAll()) {
					if (entry.isRoot || entry.shared) continue
					if (entry.obId === 'ROOT') continue
					// Skip entries created after snapshot was fetched
					if (entry.updatedAt > pollStartTime) continue

					const inServer =
						entry.type === 'bookmark'
							? serverBookmarkIds.has(entry.obId)
							: serverFolderIds.has(entry.obId)

					if (!inServer) {
						try {
							await removeNode(entry.chromeId)
						} catch {
							logger.debug(
								'Orphan Chrome node already removed:',
								entry.chromeId,
							)
						}
						idMap.removeByChrome(entry.chromeId)
						logger.info(
							`Orphan cleaned up: ${entry.type} ${entry.obId}`,
						)
					}
				}
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
					!parentMapping ||
					parentMapping.obId === 'ROOT' ||
					parentMapping.isRoot ||
					isRootNode(node.parentId)
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
						parentOb &&
						parentOb.obId !== 'ROOT' &&
						!parentOb.isRoot &&
						!isRootNode(node.parentId)
							? parentOb.obId
							: null
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

	// --- Shared sync ---

	private async pollSharedOB(): Promise<void> {
		try {
			const snapshot = await api.getSharedSnapshot()
			const previous = await loadSharedSnapshot()

			if (previous) {
				await this.applySharedOBChanges(previous, snapshot)
			} else {
				await this.initialSharedSync(snapshot)
			}

			await saveSharedSnapshot(snapshot)
			this.sharedBookmarkCount = snapshot.bookmarks.length
			this.sharedFolderCount = snapshot.sharedFolders.length

			logger.info('Shared OB poll complete', {
				sharedFolders: snapshot.sharedFolders.length,
				folders: snapshot.folders.length,
				bookmarks: snapshot.bookmarks.length,
			})
		} catch (error) {
			logger.error('Shared OB poll failed:', error)
		}
	}

	private async initialSharedSync(snapshot: SharedSyncSnapshot): Promise<void> {
		if (snapshot.sharedFolders.length === 0) return

		this.syncingFromOB = true
		try {
			// 1. Create "Partagés avec moi" container under Bookmarks Bar
			const container = await chromeCreateFolder(
				CHROME_ROOTS.BOOKMARKS_BAR,
				SHARED_CONTAINER_NAME,
			)
			idMap.set(
				container.id,
				SHARED_CONTAINER_OB_ID,
				'folder',
				new Date().toISOString(),
				true,
			)

			// Build role map: rootFolderId → role
			const rootRoleMap = new Map<string, 'editor' | 'viewer'>()
			for (const sf of snapshot.sharedFolders) {
				rootRoleMap.set(sf.folder.id, sf.role as 'editor' | 'viewer')
			}

			// Build folderId → role (descendants inherit from root)
			const folderRoleMap = new Map<string, 'editor' | 'viewer'>()
			for (const sf of snapshot.sharedFolders) {
				folderRoleMap.set(sf.folder.id, sf.role as 'editor' | 'viewer')
			}

			// Build parent→children map for role propagation
			const childrenMap = new Map<string, OBFolder[]>()
			for (const f of snapshot.folders) {
				if (f.parentId) {
					const arr = childrenMap.get(f.parentId) ?? []
					arr.push(f)
					childrenMap.set(f.parentId, arr)
				}
			}

			// Propagate roles to descendants
			const propagateRole = (folderId: string, role: 'editor' | 'viewer') => {
				const children = childrenMap.get(folderId) ?? []
				for (const child of children) {
					folderRoleMap.set(child.id, role)
					propagateRole(child.id, role)
				}
			}
			for (const sf of snapshot.sharedFolders) {
				propagateRole(sf.folder.id, sf.role as 'editor' | 'viewer')
			}

			// 2. Create root shared folders under container
			for (const sf of snapshot.sharedFolders) {
				const title = `${sf.folder.name} (${sf.owner.name})`
				const node = await chromeCreateFolder(container.id, title)
				const role = sf.role as 'editor' | 'viewer'
				idMap.set(
					node.id,
					sf.folder.id,
					'folder',
					new Date().toISOString(),
					undefined,
					true,
					role,
				)
			}

			// 3. Create descendant folders (topo-sorted)
			const descendantFolders = snapshot.folders.filter(
				(f) => !rootRoleMap.has(f.id),
			)
			for (const f of this.topoSortFolders(descendantFolders)) {
				if (idMap.hasOB(f.id)) continue
				const parentChromeId = this.resolveChromeParentId(f.parentId)
				try {
					const node = await chromeCreateFolder(
						parentChromeId,
						f.name,
						f.position,
					)
					const role = folderRoleMap.get(f.id)
					idMap.set(node.id, f.id, 'folder', f.updatedAt, undefined, true, role)
				} catch (error) {
					logger.error(
						`Failed to create shared Chrome folder "${f.name}":`,
						error,
					)
				}
			}

			// 4. Create bookmarks
			for (const bm of snapshot.bookmarks) {
				if (idMap.hasOB(bm.id)) continue
				if (isIgnoredUrl(bm.url)) continue
				const parentChromeId = this.resolveChromeParentId(bm.folderId)
				try {
					const node = await chromeCreateBookmark(
						parentChromeId,
						bm.title,
						bm.url,
						bm.position,
					)
					const role = bm.folderId ? folderRoleMap.get(bm.folderId) : undefined
					idMap.set(
						node.id,
						bm.id,
						'bookmark',
						bm.updatedAt,
						undefined,
						true,
						role,
					)
				} catch (error) {
					logger.error(
						`Failed to create shared Chrome bookmark "${bm.title}":`,
						error,
					)
				}
			}

			await idMap.save()
		} finally {
			this.syncingFromOB = false
		}
	}

	private async applySharedOBChanges(
		previous: SharedSyncSnapshot,
		current: SharedSyncSnapshot,
	): Promise<void> {
		this.syncingFromOB = true

		try {
			// Diff shared folders (collaborations added/removed/role changed)
			const prevCollabMap = new Map(
				previous.sharedFolders.map((sf) => [sf.folder.id, sf]),
			)
			const currCollabMap = new Map(
				current.sharedFolders.map((sf) => [sf.folder.id, sf]),
			)

			const addedCollabs: SharedFolderMeta[] = []
			const removedCollabs: SharedFolderMeta[] = []
			const roleChanged: {
				meta: SharedFolderMeta
				oldRole: string
				newRole: string
			}[] = []

			for (const [folderId, sf] of currCollabMap) {
				const prev = prevCollabMap.get(folderId)
				if (!prev) {
					addedCollabs.push(sf)
				} else if (prev.role !== sf.role) {
					roleChanged.push({
						meta: sf,
						oldRole: prev.role,
						newRole: sf.role,
					})
				}
			}

			for (const [folderId, sf] of prevCollabMap) {
				if (!currCollabMap.has(folderId)) {
					removedCollabs.push(sf)
				}
			}

			// Handle removed collaborations: delete Chrome subtree
			for (const sf of removedCollabs) {
				const mapping = idMap.getByOB(sf.folder.id)
				if (mapping) {
					try {
						await removeNode(mapping.chromeId)
					} catch {
						logger.debug(
							'Shared Chrome node already removed:',
							mapping.chromeId,
						)
					}
					// Clean up all idMap entries for this subtree
					this.cleanupSharedSubtree(sf.folder.id, previous)
				}
			}

			// Handle added collaborations: create Chrome subtree
			for (const sf of addedCollabs) {
				const containerMapping = idMap.getByOB(SHARED_CONTAINER_OB_ID)
				if (!containerMapping) continue

				const title = `${sf.folder.name} (${sf.owner.name})`
				const role = sf.role as 'editor' | 'viewer'

				const node = await chromeCreateFolder(containerMapping.chromeId, title)
				idMap.set(
					node.id,
					sf.folder.id,
					'folder',
					new Date().toISOString(),
					undefined,
					true,
					role,
				)

				// Create descendant folders and bookmarks for this new collaboration
				const descendantFolders = current.folders.filter((f) =>
					this.isDescendantOf(f, sf.folder.id, current.folders),
				)
				for (const f of this.topoSortFolders(descendantFolders)) {
					if (idMap.hasOB(f.id)) continue
					const parentChromeId = this.resolveChromeParentId(f.parentId)
					try {
						const fNode = await chromeCreateFolder(
							parentChromeId,
							f.name,
							f.position,
						)
						idMap.set(
							fNode.id,
							f.id,
							'folder',
							f.updatedAt,
							undefined,
							true,
							role,
						)
					} catch (error) {
						logger.error(`Failed to create shared folder "${f.name}":`, error)
					}
				}

				const allFolderIds = new Set([
					sf.folder.id,
					...descendantFolders.map((f) => f.id),
				])
				const descendantBookmarks = current.bookmarks.filter(
					(bm) => bm.folderId && allFolderIds.has(bm.folderId),
				)
				for (const bm of descendantBookmarks) {
					if (idMap.hasOB(bm.id)) continue
					if (isIgnoredUrl(bm.url)) continue
					const parentChromeId = this.resolveChromeParentId(bm.folderId)
					try {
						const bNode = await chromeCreateBookmark(
							parentChromeId,
							bm.title,
							bm.url,
							bm.position,
						)
						idMap.set(
							bNode.id,
							bm.id,
							'bookmark',
							bm.updatedAt,
							undefined,
							true,
							role,
						)
					} catch (error) {
						logger.error(
							`Failed to create shared bookmark "${bm.title}":`,
							error,
						)
					}
				}
			}

			// Handle role changes: update role in idMap for the entire subtree
			for (const { meta, newRole } of roleChanged) {
				const role = newRole as 'editor' | 'viewer'
				this.updateSubtreeRole(meta.folder.id, role, current)
			}

			// Diff folders and bookmarks (within existing collaborations)
			const folderDiff = diffFolders(previous.folders, current.folders)
			const bookmarkDiff = diffBookmarks(previous.bookmarks, current.bookmarks)

			// Build role map for new items
			const folderRoleMap = this.buildFolderRoleMap(current)

			// Apply folder additions
			for (const f of this.topoSortFolders(folderDiff.added)) {
				if (idMap.hasOB(f.id)) continue
				const parentChromeId = this.resolveChromeParentId(f.parentId)
				try {
					const node = await chromeCreateFolder(
						parentChromeId,
						f.name,
						f.position,
					)
					const role = folderRoleMap.get(f.id)
					idMap.set(node.id, f.id, 'folder', f.updatedAt, undefined, true, role)
				} catch (error) {
					logger.error(`Failed to create shared folder "${f.name}":`, error)
				}
			}

			// Apply folder modifications
			for (const f of folderDiff.modified) {
				const mapping = idMap.getByOB(f.id)
				if (!mapping || !mapping.shared) continue
				await this.updateChromeFolder(mapping.chromeId, f)
				idMap.set(
					mapping.chromeId,
					f.id,
					'folder',
					f.updatedAt,
					undefined,
					true,
					mapping.role,
				)
			}

			// Apply folder removals
			for (const f of folderDiff.removed) {
				const mapping = idMap.getByOB(f.id)
				if (!mapping || !mapping.shared) continue
				try {
					await removeNode(mapping.chromeId)
				} catch {
					logger.debug('Shared Chrome node already removed:', mapping.chromeId)
				}
				idMap.removeByOB(f.id)
			}

			// Apply bookmark additions
			for (const bm of bookmarkDiff.added) {
				if (idMap.hasOB(bm.id)) continue
				if (isIgnoredUrl(bm.url)) continue
				const parentChromeId = this.resolveChromeParentId(bm.folderId)
				try {
					const node = await chromeCreateBookmark(
						parentChromeId,
						bm.title,
						bm.url,
						bm.position,
					)
					const role = bm.folderId ? folderRoleMap.get(bm.folderId) : undefined
					idMap.set(
						node.id,
						bm.id,
						'bookmark',
						bm.updatedAt,
						undefined,
						true,
						role,
					)
				} catch (error) {
					logger.error(`Failed to create shared bookmark "${bm.title}":`, error)
				}
			}

			// Apply bookmark modifications
			for (const bm of bookmarkDiff.modified) {
				const mapping = idMap.getByOB(bm.id)
				if (!mapping || !mapping.shared) continue
				await this.updateChromeBookmark(mapping.chromeId, bm)
				idMap.set(
					mapping.chromeId,
					bm.id,
					'bookmark',
					bm.updatedAt,
					undefined,
					true,
					mapping.role,
				)
			}

			// Apply bookmark removals
			for (const bm of bookmarkDiff.removed) {
				const mapping = idMap.getByOB(bm.id)
				if (!mapping || !mapping.shared) continue
				try {
					await removeNode(mapping.chromeId)
				} catch {
					logger.debug('Shared Chrome node already removed:', mapping.chromeId)
				}
				idMap.removeByOB(bm.id)
			}

			await idMap.save()
		} finally {
			this.syncingFromOB = false
		}
	}

	private isDescendantOf(
		folder: OBFolder,
		ancestorId: string,
		allFolders: OBFolder[],
	): boolean {
		const folderMap = new Map(allFolders.map((f) => [f.id, f]))
		let current = folder
		while (current.parentId) {
			if (current.parentId === ancestorId) return true
			const parent = folderMap.get(current.parentId)
			if (!parent) break
			current = parent
		}
		return false
	}

	private cleanupSharedSubtree(
		rootFolderId: string,
		snapshot: SharedSyncSnapshot,
	): void {
		// Find all folder IDs in this subtree
		const folderIds = new Set<string>([rootFolderId])
		let changed = true
		while (changed) {
			changed = false
			for (const f of snapshot.folders) {
				if (f.parentId && folderIds.has(f.parentId) && !folderIds.has(f.id)) {
					folderIds.add(f.id)
					changed = true
				}
			}
		}

		// Remove all idMap entries for folders and bookmarks in this subtree
		for (const fId of folderIds) {
			idMap.removeByOB(fId)
		}
		for (const bm of snapshot.bookmarks) {
			if (bm.folderId && folderIds.has(bm.folderId)) {
				idMap.removeByOB(bm.id)
			}
		}
	}

	private updateSubtreeRole(
		rootFolderId: string,
		role: 'editor' | 'viewer',
		snapshot: SharedSyncSnapshot,
	): void {
		// Find all folder IDs in this subtree
		const folderIds = new Set<string>([rootFolderId])
		let changed = true
		while (changed) {
			changed = false
			for (const f of snapshot.folders) {
				if (f.parentId && folderIds.has(f.parentId) && !folderIds.has(f.id)) {
					folderIds.add(f.id)
					changed = true
				}
			}
		}

		// Update role in idMap for all items in the subtree
		for (const fId of folderIds) {
			const mapping = idMap.getByOB(fId)
			if (mapping) {
				idMap.set(
					mapping.chromeId,
					fId,
					'folder',
					mapping.updatedAt,
					undefined,
					true,
					role,
				)
			}
		}
		for (const bm of snapshot.bookmarks) {
			if (bm.folderId && folderIds.has(bm.folderId)) {
				const mapping = idMap.getByOB(bm.id)
				if (mapping) {
					idMap.set(
						mapping.chromeId,
						bm.id,
						'bookmark',
						mapping.updatedAt,
						undefined,
						true,
						role,
					)
				}
			}
		}
	}

	private buildFolderRoleMap(
		snapshot: SharedSyncSnapshot,
	): Map<string, 'editor' | 'viewer'> {
		const roleMap = new Map<string, 'editor' | 'viewer'>()

		for (const sf of snapshot.sharedFolders) {
			roleMap.set(sf.folder.id, sf.role as 'editor' | 'viewer')
		}

		// Propagate to descendants
		let changed = true
		while (changed) {
			changed = false
			for (const f of snapshot.folders) {
				if (f.parentId && roleMap.has(f.parentId) && !roleMap.has(f.id)) {
					roleMap.set(f.id, roleMap.get(f.parentId)!)
					changed = true
				}
			}
		}

		return roleMap
	}

	async setSharedEnabled(enabled: boolean): Promise<void> {
		this.sharedSyncEnabled = enabled
		await chrome.storage.local.set({
			[STORAGE_KEYS.sharedSyncEnabled]: enabled,
		})

		if (enabled) {
			await this.pollSharedOB()
		} else {
			// Remove "Partagés avec moi" folder from Chrome
			const containerMapping = idMap.getByOB(SHARED_CONTAINER_OB_ID)
			if (containerMapping) {
				try {
					await removeNode(containerMapping.chromeId)
				} catch {
					logger.debug('Shared container already removed')
				}
			}
			// Clean up shared entries from idMap
			idMap.clearShared()
			// Remove shared snapshot
			await chrome.storage.local.remove(STORAGE_KEYS.lastSharedSnapshot)
			this.sharedBookmarkCount = 0
			this.sharedFolderCount = 0
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
			sharedSyncEnabled: this.sharedSyncEnabled,
			sharedBookmarkCount: this.sharedBookmarkCount,
			sharedFolderCount: this.sharedFolderCount,
		}
	}
}
