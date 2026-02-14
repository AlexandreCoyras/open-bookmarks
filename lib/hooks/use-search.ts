import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useSearch(query: string, enabled: boolean) {
	return useQuery({
		queryKey: ['search', query],
		queryFn: async () => {
			const { data, error } = await api.api.search.get({
				query: { q: query },
			})
			if (error) throw error
			return data
		},
		enabled: enabled && query.length >= 2,
		staleTime: 30_000,
	})
}
