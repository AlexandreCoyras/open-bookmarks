import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
	window.addEventListener('pointerdown', callback, { once: true })
	return () => window.removeEventListener('pointerdown', callback)
}

function getSnapshot() {
	return window.matchMedia('(pointer: coarse)').matches
}

function getServerSnapshot() {
	return false
}

export function useTouchDevice() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
