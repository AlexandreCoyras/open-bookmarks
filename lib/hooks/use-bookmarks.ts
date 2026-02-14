import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useBookmarks(folderId?: string | null) {
	return useQuery({
		queryKey: ['bookmarks', folderId ?? 'root'],
		queryFn: async () => {
			const { data, error } = await api.api.bookmarks.get({
				query: { folderId: folderId ?? undefined },
			})
			if (error) throw error
			return data
		},
	})
}

export function useCreateBookmark() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (body: {
			url: string
			title: string
			description?: string
			favicon?: string
			folderId?: string
			position?: number
		}) => {
			const { data, error } = await api.api.bookmarks.post(body)
			if (error) throw error
			return data
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['bookmarks', variables.folderId ?? 'root'],
			})
		},
	})
}

export function useUpdateBookmark() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			...body
		}: {
			id: string
			url?: string
			title?: string
			description?: string
			favicon?: string
			folderId?: string | null
			position?: number
		}) => {
			const { data, error } = await api.api.bookmarks({ id }).patch(body)
			if (error) throw error
			return data
		},
		onMutate: async (variables) => {
			if (variables.folderId === undefined) return

			await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['bookmarks'],
			})

			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['bookmarks'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((b) => b.id !== variables.id)
				},
			)

			return { previousData }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey, data)
				}
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}

export function useDeleteBookmark() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await api.api.bookmarks({ id }).delete()
			if (error) throw error
			return data
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['bookmarks'],
			})

			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['bookmarks'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((b) => b.id !== id)
				},
			)

			return { previousData }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey, data)
				}
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}

export function useBulkDeleteBookmarks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (ids: string[]) => {
			const { data, error } = await api.api.bookmarks['bulk-delete'].post({
				ids,
			})
			if (error) throw error
			return data
		},
		onMutate: async (ids) => {
			await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['bookmarks'],
			})

			const idSet = new Set(ids)
			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['bookmarks'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((b) => !idSet.has(b.id))
				},
			)

			return { previousData }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey, data)
				}
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}

export function useBulkMoveBookmarks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			ids,
			folderId,
		}: { ids: string[]; folderId: string | null }) => {
			const { data, error } = await api.api.bookmarks['bulk-move'].post({
				ids,
				folderId,
			})
			if (error) throw error
			return data
		},
		onMutate: async ({ ids }) => {
			await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['bookmarks'],
			})

			const idSet = new Set(ids)
			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['bookmarks'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((b) => !idSet.has(b.id))
				},
			)

			return { previousData }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey, data)
				}
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}

export function useReorderBookmarks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			items: Array<{
				id: string
				position: number
				folderId?: string | null
			}>,
		) => {
			const { data, error } = await api.api.bookmarks.reorder.put({
				items,
			})
			if (error) throw error
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}
