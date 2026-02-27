import { OB_PROD_URL, STORAGE_KEYS } from '../lib/constants'
import type { SyncStats } from '../types'

const statusBadge = document.getElementById('status-badge')!
const authWarning = document.getElementById('auth-warning')!
const syncControls = document.getElementById('sync-controls')!
const syncToggle = document.getElementById('sync-toggle') as HTMLInputElement
const sharedToggle = document.getElementById(
	'shared-toggle',
) as HTMLInputElement
const bookmarkCount = document.getElementById('bookmark-count')!
const folderCount = document.getElementById('folder-count')!
const sharedFolderStat = document.getElementById('shared-folder-stat')!
const sharedBookmarkStat = document.getElementById('shared-bookmark-stat')!
const sharedFolderCount = document.getElementById('shared-folder-count')!
const sharedBookmarkCount = document.getElementById('shared-bookmark-count')!
const lastSync = document.getElementById('last-sync')!
const syncNowBtn = document.getElementById('sync-now') as HTMLButtonElement
const openAppBtn = document.getElementById('open-app') as HTMLAnchorElement
const openAppLink = document.getElementById(
	'open-app-link',
) as HTMLAnchorElement

async function getAppUrl(): Promise<string> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.baseUrl)
	return (result[STORAGE_KEYS.baseUrl] as string) || OB_PROD_URL
}

function formatDate(isoString: string | null): string {
	if (!isoString) return 'jamais'
	const date = new Date(isoString)
	return date.toLocaleString('fr-FR', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

const STATUS_LABELS: Record<string, string> = {
	idle: 'Connecté',
	syncing: 'Sync...',
	error: 'Erreur',
	unauthenticated: 'Non connecté',
}

function updateUI(stats: SyncStats): void {
	// Badge
	statusBadge.textContent = STATUS_LABELS[stats.status] ?? stats.status
	statusBadge.className = `badge badge-${stats.status}`

	// Auth warning
	const isAuth = stats.status !== 'unauthenticated'
	authWarning.hidden = isAuth
	syncControls.style.display = isAuth ? 'block' : 'none'

	// Toggle
	syncToggle.checked = stats.syncEnabled

	// Shared toggle
	sharedToggle.checked = stats.sharedSyncEnabled
	sharedToggle.disabled = !stats.syncEnabled

	// Stats
	bookmarkCount.textContent = String(stats.bookmarkCount)
	folderCount.textContent = String(stats.folderCount)

	// Shared stats
	const showShared = stats.sharedSyncEnabled
	sharedFolderStat.hidden = !showShared
	sharedBookmarkStat.hidden = !showShared
	if (showShared) {
		sharedFolderCount.textContent = String(stats.sharedFolderCount)
		sharedBookmarkCount.textContent = String(stats.sharedBookmarkCount)
	}

	// Last sync
	lastSync.textContent = `Dernière sync : ${formatDate(stats.lastSyncTime)}`

	// Sync button
	syncNowBtn.disabled = stats.status === 'syncing' || !stats.syncEnabled
}

async function loadStatus(): Promise<void> {
	const stats = await chrome.runtime.sendMessage({ type: 'getStatus' })
	updateUI(stats as SyncStats)
}

// Event listeners
syncToggle.addEventListener('change', async () => {
	syncToggle.disabled = true
	const stats = await chrome.runtime.sendMessage({
		type: 'setEnabled',
		enabled: syncToggle.checked,
	})
	updateUI(stats as SyncStats)
	syncToggle.disabled = false
})

sharedToggle.addEventListener('change', async () => {
	sharedToggle.disabled = true
	const stats = await chrome.runtime.sendMessage({
		type: 'setSharedEnabled',
		enabled: sharedToggle.checked,
	})
	updateUI(stats as SyncStats)
	sharedToggle.disabled = false
})

syncNowBtn.addEventListener('click', async () => {
	syncNowBtn.disabled = true
	syncNowBtn.textContent = 'Synchronisation...'
	await chrome.runtime.sendMessage({ type: 'triggerSync' })
	await loadStatus()
	syncNowBtn.textContent = 'Synchroniser maintenant'
	syncNowBtn.disabled = false
})

// Setup app links
getAppUrl().then((url) => {
	openAppBtn.addEventListener('click', (e) => {
		e.preventDefault()
		chrome.tabs.create({ url })
	})
	openAppLink.addEventListener('click', (e) => {
		e.preventDefault()
		chrome.tabs.create({ url })
	})
})

// Load on open
loadStatus()
