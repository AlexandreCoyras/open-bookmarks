'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import {
	persistQueryClientRestore,
	persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import { type ReactNode, useEffect } from 'react'
import { RegisterSW } from '@/components/register-sw'
import { Toaster } from '@/components/ui/sonner'
import { getQueryClient } from '@/lib/get-query-client'
import { queryPersister } from '@/lib/query-persister'

const persistOptions = {
	persister: queryPersister,
	maxAge: 1000 * 60 * 60 * 24, // 24h
	dehydrateOptions: {
		shouldDehydrateQuery: (query: { state: { status: string } }) =>
			query.state.status === 'success',
	},
}

export function Providers({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient()

	useEffect(() => {
		const opts = { queryClient, ...persistOptions }
		persistQueryClientRestore(opts)
		return persistQueryClientSubscribe(opts)
	}, [queryClient])

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<Toaster />
			<RegisterSW />
		</QueryClientProvider>
	)
}
