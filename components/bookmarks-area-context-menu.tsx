'use client'

import { FolderPlus, Plus, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useTouchDevice } from '@/lib/hooks/use-touch-device'

type BookmarksAreaContextMenuProps = {
	children: ReactNode
	onNewFolder: () => void
	onAddBookmark: () => void
	onImport?: () => void
	folderLabel?: string
}

export function BookmarksAreaContextMenu({
	children,
	onNewFolder,
	onAddBookmark,
	onImport,
	folderLabel,
}: BookmarksAreaContextMenuProps) {
	const isTouch = useTouchDevice()
	const t = useTranslations('ContextMenu')

	const label = folderLabel ?? t('newFolder')

	if (isTouch) return <>{children}</>

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={onNewFolder}>
					<FolderPlus className="mr-2 size-4" />
					{label}
				</ContextMenuItem>
				<ContextMenuItem onClick={onAddBookmark}>
					<Plus className="mr-2 size-4" />
					{t('addBookmark')}
				</ContextMenuItem>
				{onImport && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={onImport}>
							<Upload className="mr-2 size-4" />
							{t('importBookmarks')}
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	)
}
