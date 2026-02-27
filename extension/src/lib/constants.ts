export const OB_PROD_URL = 'https://www.openbookmarks.app'
export const OB_DEV_URL = 'http://localhost:3000'

export const POLL_INTERVAL_MINUTES = 3
export const ALARM_NAME = 'ob-sync-poll'
export const DEBOUNCE_MS = 500

export const STORAGE_KEYS = {
	idMap: 'ob-id-map',
	lastSnapshot: 'ob-last-snapshot',
	lastSyncTime: 'ob-last-sync-time',
	syncEnabled: 'ob-sync-enabled',
	baseUrl: 'ob-base-url',
} as const

export const CHROME_ROOTS = {
	BOOKMARKS_BAR: '1',
	OTHER_BOOKMARKS: '2',
} as const

export const IGNORED_URL_PREFIXES = [
	'chrome://',
	'chrome-extension://',
	'about:',
	'edge://',
	'brave://',
]
