'use client'

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { RegisterSW } from '@/components/register-sw'
import { Toaster } from '@/components/ui/sonner'
import { getQueryClient } from '@/lib/get-query-client'
import { queryPersister } from '@/lib/query-persister'

export function Providers({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient()

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: queryPersister,
				maxAge: 1000 * 60 * 60 * 24, // 24h
				dehydrateOptions: {
					shouldDehydrateQuery: (query) => query.state.status === 'success',
				},
			}}
		>
			{children}
			<Toaster />
			<RegisterSW />
		</PersistQueryClientProvider>
	)
}
