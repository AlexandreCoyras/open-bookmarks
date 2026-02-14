'use client'

import { FolderPlus, Plus, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'

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
	folderLabel = 'Nouveau dossier',
}: BookmarksAreaContextMenuProps) {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={onNewFolder}>
					<FolderPlus className="mr-2 size-4" />
					{folderLabel}
				</ContextMenuItem>
				<ContextMenuItem onClick={onAddBookmark}>
					<Plus className="mr-2 size-4" />
					Ajouter un favori
				</ContextMenuItem>
				{onImport && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={onImport}>
							<Upload className="mr-2 size-4" />
							Importer des favoris
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	)
}
