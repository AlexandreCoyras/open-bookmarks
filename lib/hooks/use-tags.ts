import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useTags() {
	return useQuery({
		queryKey: ['tags'],
		queryFn: async () => {
			const { data, error } = await api.api.tags.get()
			if (error) throw error
			return data
		},
	})
}
