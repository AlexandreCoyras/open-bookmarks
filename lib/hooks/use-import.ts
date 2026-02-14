import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useImportBookmarks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (html: string) => {
			const { data, error } = await api.api.import.bookmarks.post({
				html,
			})
			if (error) throw error
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['folders'] })
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}
