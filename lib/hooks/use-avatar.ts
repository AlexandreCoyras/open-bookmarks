import { useMutation } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'

export function useUploadAvatar() {
	const { refetch } = useSession()

	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData()
			formData.append('file', file)

			const res = await fetch('/api/avatar/upload', {
				method: 'POST',
				body: formData,
			})

			if (!res.ok) {
				const err = await res.json()
				throw new Error(err.error ?? "Erreur lors de l'upload")
			}

			return res.json() as Promise<{ url: string }>
		},
		onSuccess: () => {
			refetch()
		},
	})
}

export function useDeleteAvatar() {
	const { refetch } = useSession()

	return useMutation({
		mutationFn: async () => {
			const res = await fetch('/api/avatar', {
				method: 'DELETE',
			})

			if (!res.ok) {
				throw new Error('Erreur lors de la suppression')
			}

			return res.json() as Promise<{ url: null }>
		},
		onSuccess: () => {
			refetch()
		},
	})
}
