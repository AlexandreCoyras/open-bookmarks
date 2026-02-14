'use client'

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/lib/hooks/use-online-status'

export function OfflineBanner() {
	const isOnline = useOnlineStatus()

	if (isOnline) return null

	return (
		<div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
			<WifiOff className="size-4" />
			<span>
				Vous êtes hors-ligne. Les données affichées proviennent du cache.
			</span>
		</div>
	)
}
