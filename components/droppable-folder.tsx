'use client'

import { useDroppable } from '@dnd-kit/core'
import { FolderCard, type FolderData } from '@/components/folder-card'
import { cn } from '@/lib/utils'

export function DroppableFolder({
	folder,
	onEdit,
	onDelete,
}: {
	folder: FolderData
	onEdit: () => void
	onDelete: () => void
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `folder-${folder.id}`,
		data: { type: 'folder', folderId: folder.id },
	})

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'rounded-lg transition-colors',
				isOver && 'ring-2 ring-primary bg-primary/5',
			)}
		>
			<FolderCard folder={folder} onEdit={onEdit} onDelete={onDelete} />
		</div>
	)
}
