'use client'

import { FolderContent } from '@/app/[locale]/dashboard/folders/[id]/folder-content'
import { HomeContent } from '@/app/[locale]/dashboard/home-content'
import { useFolderNavigation } from '@/lib/folder-navigation'

export function DashboardView() {
	const { currentFolderId } = useFolderNavigation()

	if (currentFolderId) {
		return <FolderContent key={currentFolderId} id={currentFolderId} />
	}

	return <HomeContent />
}
