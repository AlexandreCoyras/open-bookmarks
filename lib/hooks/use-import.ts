import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useImportBookmarks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			html,
			folderId,
		}: {
			html: string
			folderId?: string
		}) => {
			const { data, error } = await api.api.import.bookmarks.post({
				html,
				folderId,
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
