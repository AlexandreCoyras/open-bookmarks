'use client'

import { useEffect } from 'react'

export function RegisterSW() {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/serwist/sw.js', { scope: '/' })
		}
	}, [])
	return null
}
