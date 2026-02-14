import { isServer, QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000,
				gcTime: 1000 * 60 * 60 * 24, // 24h
				networkMode: 'offlineFirst',
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
