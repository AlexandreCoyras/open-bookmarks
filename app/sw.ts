import { defaultCache } from '@serwist/turbopack/worker'
import {
	ExpirationPlugin,
	NetworkFirst,
	type PrecacheEntry,
	Serwist,
} from 'serwist'

declare const self: ServiceWorkerGlobalScope & {
	__SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

const runtimeCaching = defaultCache.map((entry) => {
	if ('cacheName' in entry.handler && entry.handler.cacheName === 'apis') {
		return {
			...entry,
			handler: new NetworkFirst({
				cacheName: 'apis',
				plugins: [
					new ExpirationPlugin({
						maxEntries: 128,
						maxAgeSeconds: 24 * 60 * 60,
						maxAgeFrom: 'last-used',
					}),
				],
				networkTimeoutSeconds: 10,
			}),
		}
	}
	return entry
})

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching,
	fallbacks: {
		entries: [
			{
				url: '/~offline',
				matcher({ request }) {
					return request.destination === 'document'
				},
			},
		],
	},
})

serwist.addEventListeners()
