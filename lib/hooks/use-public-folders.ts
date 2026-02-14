import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/eden'

export function usePublicFolder(slug: string) {
	return useQuery({
		queryKey: ['public-folder', slug],
		queryFn: async () => {
			const { data, error } = await api.api.public.folders({ slug }).get()
			if (error) throw error
			return data
		},
		enabled: !!slug,
	})
}

export function usePublicSubfolders(slug: string, parentId?: string) {
	return useQuery({
		queryKey: ['public-subfolders', slug, parentId ?? 'root'],
		queryFn: async () => {
			const { data, error } = await api.api.public
				.folders({ slug })
				.subfolders.get({
					query: { parentId },
				})
			if (error) throw error
			return data
		},
		enabled: !!slug,
	})
}

export function usePublicBookmarks(slug: string, folderId?: string) {
	return useQuery({
		queryKey: ['public-bookmarks', slug, folderId ?? 'root'],
		queryFn: async () => {
			const { data, error } = await api.api.public
				.folders({ slug })
				.bookmarks.get({
					query: { folderId },
				})
			if (error) throw error
			return data
		},
		enabled: !!slug,
	})
}

export function usePublicBreadcrumb(slug: string, folderId?: string) {
	return useQuery({
		queryKey: ['public-breadcrumb', slug, folderId],
		queryFn: async () => {
			const { data, error } = await api.api.public
				.folders({ slug })
				.breadcrumb.get({
					query: { folderId },
				})
			if (error) throw error
			return data
		},
		enabled: !!slug && !!folderId,
	})
}
