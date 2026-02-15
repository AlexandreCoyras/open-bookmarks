import { treaty } from '@elysiajs/eden'
import type { App } from '@/server/app'

const getBaseUrl = () => {
	if (typeof window !== 'undefined') return window.location.origin
	return process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'
}

export const api = treaty<App>(getBaseUrl())
