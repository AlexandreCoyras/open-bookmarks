import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function useSharedFolders() {
	return useQuery({
		queryKey: ['shared-folders'],
		queryFn: async () => {
			const { data, error } =
				await api.api.collaborators['shared-with-me'].get()
			if (error) throw error
			return data
		},
	})
}

export function useCollaborators(folderId: string) {
	return useQuery({
		queryKey: ['collaborators', folderId],
		queryFn: async () => {
			const { data, error } = await api.api.collaborators
				.folders({ folderId })
				.get()
			if (error) throw error
			return data
		},
		enabled: !!folderId,
	})
}

export function useInviteCollaborator() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			folderId,
			email,
			role,
		}: {
			folderId: string
			email: string
			role: 'viewer' | 'editor'
		}) => {
			const { data, error } = await api.api.collaborators
				.folders({ folderId })
				.post({ email, role })
			if (error) throw error
			return data
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['collaborators', variables.folderId],
			})
		},
	})
}

export function useUpdateCollaboratorRole() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			role,
		}: {
			id: string
			role: 'viewer' | 'editor'
		}) => {
			const { data, error } = await api.api
				.collaborators({ id })
				.patch({ role })
			if (error) throw error
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['collaborators'] })
		},
	})
}

export function useRemoveCollaborator() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await api.api.collaborators({ id }).delete()
			if (error) throw error
			return data
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ['collaborators'] })

			const previousData = queryClient.getQueriesData<Array<{ id: string }>>({
				queryKey: ['collaborators'],
			})

			queryClient.setQueriesData<Array<{ id: string }>>(
				{ queryKey: ['collaborators'] },
				(old) => {
					if (!Array.isArray(old)) return old
					return old.filter((c) => c.id !== id)
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
			queryClient.invalidateQueries({ queryKey: ['collaborators'] })
		},
	})
}
