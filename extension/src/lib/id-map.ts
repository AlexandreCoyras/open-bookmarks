import type { IdMapEntry } from '../types'
import { STORAGE_KEYS } from './constants'
import { logger } from './logger'

type IdMapStore = Record<string, IdMapEntry>

let store: IdMapStore = {}
let reverseIndex: Map<string, string> = new Map()
let dirty = false
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function rebuildReverseIndex() {
	reverseIndex = new Map()
	for (const [chromeId, entry] of Object.entries(store)) {
		reverseIndex.set(entry.obId, chromeId)
	}
}

export const idMap = {
	async load(): Promise<void> {
		const result = await chrome.storage.local.get(STORAGE_KEYS.idMap)
		store = (result[STORAGE_KEYS.idMap] as IdMapStore) || {}
		rebuildReverseIndex()
		logger.debug(`ID map loaded: ${Object.keys(store).length} entries`)
	},

	async save(): Promise<void> {
		if (!dirty) return
		await chrome.storage.local.set({ [STORAGE_KEYS.idMap]: store })
		dirty = false
		logger.debug(`ID map saved: ${Object.keys(store).length} entries`)
	},

	scheduleSave(): void {
		dirty = true
		if (saveTimeout) clearTimeout(saveTimeout)
		saveTimeout = setTimeout(() => {
			this.save()
			saveTimeout = null
		}, 500)
	},

	getByChrome(chromeId: string): IdMapEntry | null {
		return store[chromeId] ?? null
	},

	getByOB(obId: string): IdMapEntry | null {
		const chromeId = reverseIndex.get(obId)
		if (!chromeId) return null
		return store[chromeId] ?? null
	},

	set(
		chromeId: string,
		obId: string,
		type: 'folder' | 'bookmark',
		updatedAt: string,
		isRoot?: boolean,
	): void {
		const existing = store[chromeId]
		if (existing) {
			reverseIndex.delete(existing.obId)
		}

		store[chromeId] = { chromeId, obId, type, updatedAt, isRoot }
		reverseIndex.set(obId, chromeId)
		this.scheduleSave()
	},

	removeByChrome(chromeId: string): void {
		const entry = store[chromeId]
		if (entry) {
			reverseIndex.delete(entry.obId)
			delete store[chromeId]
			this.scheduleSave()
		}
	},

	removeByOB(obId: string): void {
		const chromeId = reverseIndex.get(obId)
		if (chromeId) {
			delete store[chromeId]
			reverseIndex.delete(obId)
			this.scheduleSave()
		}
	},

	getAll(): IdMapEntry[] {
		return Object.values(store)
	},

	getAllByType(type: 'folder' | 'bookmark'): IdMapEntry[] {
		return Object.values(store).filter((e) => e.type === type)
	},

	has(chromeId: string): boolean {
		return chromeId in store
	},

	hasOB(obId: string): boolean {
		return reverseIndex.has(obId)
	},

	get size(): number {
		return Object.keys(store).length
	},

	clear(): void {
		store = {}
		reverseIndex = new Map()
		this.scheduleSave()
	},
}
