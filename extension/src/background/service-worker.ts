import { ALARM_NAME } from '../lib/constants'
import { logger } from '../lib/logger'
import { SyncEngine } from '../lib/sync-engine'
import type { PopupMessage, SyncStats } from '../types'

const engine = new SyncEngine()

// Initialize on service worker start
engine.init().catch((error) => {
	logger.error('Failed to initialize sync engine:', error)
})

// Wire Chrome bookmark events
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
	engine.onChromeCreated(id, bookmark)
})

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
	engine.onChromeRemoved(id, removeInfo)
})

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
	engine.onChromeChanged(id, changeInfo)
})

chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
	engine.onChromeMoved(id, moveInfo)
})

// Periodic polling (OB → Chrome)
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) {
		engine.pollOB()
	}
})

// First install / update
chrome.runtime.onInstalled.addListener((details) => {
	logger.info('Extension installed/updated:', details.reason)
})

// Messages from popup
chrome.runtime.onMessage.addListener(
	(
		message: PopupMessage,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response: SyncStats | { ok: boolean }) => void,
	) => {
		switch (message.type) {
			case 'getStatus':
				sendResponse(engine.getStatus())
				break
			case 'triggerSync':
				engine
					.pollOB()
					.then(() => sendResponse({ ok: true }))
					.catch(() => sendResponse({ ok: false }))
				return true // async response
			case 'setEnabled':
				engine
					.setEnabled(message.enabled)
					.then(() => sendResponse(engine.getStatus()))
					.catch(() => sendResponse(engine.getStatus()))
				return true // async response
			case 'setSharedEnabled':
				engine
					.setSharedEnabled(message.enabled)
					.then(() => sendResponse(engine.getStatus()))
					.catch(() => sendResponse(engine.getStatus()))
				return true // async response
		}
	},
)
