import { isServer, QueryCache, QueryClient } from '@tanstack/react-query'
import { getErrorStatus } from '@/lib/utils'

function makeQueryClient() {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error) => {
				if (typeof window === 'undefined') return
				if (getErrorStatus(error) === 401) {
					const locale = window.location.pathname.split('/')[1] || 'fr'
					window.location.href = `/${locale}/login`
				}
			},
		}),
		defaultOptions: {
			queries: {
				staleTime: 300_000,
				gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
				networkMode: 'offlineFirst',
				retry: (failureCount, error) => {
					const status = getErrorStatus(error)
					if (status === 401 || status === 403 || status === 404) return false
					return failureCount < 3
				},
			},
		},
	})
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
	if (isServer) {
		return makeQueryClient()
	}
	if (!browserQueryClient) browserQueryClient = makeQueryClient()
	return browserQueryClient
}
