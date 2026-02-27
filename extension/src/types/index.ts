export type OBFolder = {
	id: string
	name: string
	parentId: string | null
	position: number
	color: string | null
	icon: string | null
	updatedAt: string
	createdAt: string
}

export type OBBookmark = {
	id: string
	url: string
	title: string
	description: string | null
	favicon: string | null
	folderId: string | null
	position: number
	updatedAt: string
	createdAt: string
}

export type SyncSnapshot = {
	folders: OBFolder[]
	bookmarks: OBBookmark[]
	serverTime: string
}

export type IdMapEntry = {
	chromeId: string
	obId: string
	type: 'folder' | 'bookmark'
	updatedAt: string
	isRoot?: boolean
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'unauthenticated'

export type ChromeChange =
	| {
			action: 'created'
			nodeType: 'folder' | 'bookmark'
			chromeId: string
			node: chrome.bookmarks.BookmarkTreeNode
	  }
	| { action: 'removed'; chromeId: string; parentId: string }
	| {
			action: 'changed'
			chromeId: string
			changes: { title?: string; url?: string }
	  }
	| {
			action: 'moved'
			chromeId: string
			newParentId: string
			newIndex: number
	  }

export type PopupMessage =
	| { type: 'getStatus' }
	| { type: 'triggerSync' }
	| { type: 'setEnabled'; enabled: boolean }

export type SyncStats = {
	status: SyncStatus
	lastSyncTime: string | null
	syncEnabled: boolean
	bookmarkCount: number
	folderCount: number
}
