import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useFolders(parentId?: string | null) {
	return useQuery({
		queryKey: ['folders', parentId ?? 'root'],
		queryFn: async () => {
			const { data, error } = await api.api.folders.get({
				query: { parentId: parentId ?? undefined },
			})
			if (error) throw error
			return data
		},
	})
}

export function useFolder(id: string) {
	return useQuery({
		queryKey: ['folder', id],
		queryFn: async () => {
			const { data, error } = await api.api.folders({ id }).get()
			if (error) throw error
			return data
		},
		enabled: !!id,
	})
}

export function useBreadcrumb(folderId: string) {
	return useQuery({
		queryKey: ['breadcrumb', folderId],
		queryFn: async () => {
			const { data, error } = await api.api
				.folders({ id: folderId })
				.breadcrumb.get()
			if (error) throw error
			return data
		},
		enabled: !!folderId,
	})
}

export function useCheckSlug(slug: string, folderId?: string) {
	return useQuery({
		queryKey: ['check-slug', slug],
		queryFn: async () => {
			const { data, error } = await api.api.folders['check-slug'].get({
				query: { slug, folderId },
			})
			if (error) throw error
			return data
		},
		enabled: slug.length >= 3,
		staleTime: 10_000,
	})
}

export function useCreateFolder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (body: {
			name: string
			color?: string
			icon?: string | null
			parentId?: string
			position?: number
		}) => {
			const { data, error } = await api.api.folders.post({
				...body,
				icon: body.icon ?? undefined,
			})
			if (error) throw error
			return data
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['folders', variables.parentId ?? 'root'],
			})
		},
	})
}

export function useUpdateFolder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			...body
		}: {
			id: string
			name?: string
			color?: string
			icon?: string | null
			parentId?: string | null
			position?: number
			publicSlug?: string | null
		}) => {
			const { data, error } = await api.api.folders({ id }).patch(body)
			if (error) throw error
			return data
		},
		onMutate: async (variables) => {
			if (variables.parentId === undefined) return

			await queryClient.cancelQueries({ queryKey: ['folders'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['folders'],
			})

			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['folders'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((f) => f.id !== variables.id)
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
			queryClient.invalidateQueries({ queryKey: ['folders'] })
			queryClient.invalidateQueries({ queryKey: ['folder'] })
			queryClient.invalidateQueries({ queryKey: ['breadcrumb'] })
		},
	})
}

export function useDeleteFolder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await api.api.folders({ id }).delete()
			if (error) throw error
			return data
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ['folders'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['folders'],
			})

			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['folders'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((f) => f.id !== id)
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
			queryClient.invalidateQueries({ queryKey: ['folders'] })
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
		},
	})
}

export function useReorderFolders() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			items: Array<{
				id: string
				position: number
				parentId?: string | null
			}>,
		) => {
			const { data, error } = await api.api.folders.reorder.put({
				items,
			})
			if (error) throw error
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['folders'] })
		},
	})
}
