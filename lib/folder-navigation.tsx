'use client'

import { useParams } from 'next/navigation'
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'

type FolderNavigationContextValue = {
	currentFolderId: string | null
	navigateToFolder: (
		folderId: string | null,
		options?: { replace?: boolean },
	) => void
	buildHref: (folderId: string | null) => string
}

const FolderNavigationContext =
	createContext<FolderNavigationContextValue | null>(null)

function parseFolderIdFromPath(pathname: string): string | null {
	const match = pathname.match(/\/dashboard\/folders\/([^/]+)/)
	return match?.[1] ?? null
}

export function FolderNavigationProvider({
	children,
}: {
	children: ReactNode
}) {
	const params = useParams<{ locale: string; id?: string }>()
	const locale = params.locale
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(
		params.id ?? null,
	)

	// Sync on popstate (browser back/forward)
	useEffect(() => {
		function onPopState() {
			setCurrentFolderId(parseFolderIdFromPath(window.location.pathname))
		}
		window.addEventListener('popstate', onPopState)
		return () => window.removeEventListener('popstate', onPopState)
	}, [])

	const navigateToFolder = useCallback(
		(folderId: string | null, options?: { replace?: boolean }) => {
			setCurrentFolderId(folderId)
			const url = folderId
				? `/${locale}/dashboard/folders/${folderId}`
				: `/${locale}/dashboard`
			if (options?.replace) {
				window.history.replaceState({}, '', url)
			} else {
				window.history.pushState({}, '', url)
			}
		},
		[locale],
	)

	const buildHref = useCallback(
		(folderId: string | null) => {
			return folderId
				? `/${locale}/dashboard/folders/${folderId}`
				: `/${locale}/dashboard`
		},
		[locale],
	)

	return (
		<FolderNavigationContext
			value={{ currentFolderId, navigateToFolder, buildHref }}
		>
			{children}
		</FolderNavigationContext>
	)
}

export function useFolderNavigation() {
	const ctx = useContext(FolderNavigationContext)
	if (!ctx) {
		throw new Error(
			'useFolderNavigation must be used within FolderNavigationProvider',
		)
	}
	return ctx
}

export function useFolderNavigationOptional() {
	return useContext(FolderNavigationContext)
}
