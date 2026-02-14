'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useDndItems } from '@/components/dnd-provider'
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
	const { isDragging: isAnyDragging } = useDndItems()
	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: `folder-${folder.id}`,
		data: { type: 'folder', folderId: folder.id },
	})

	const {
		setNodeRef: setDraggableRef,
		attributes,
		listeners,
		isDragging,
	} = useDraggable({
		id: `drag-folder-${folder.id}`,
		data: {
			type: 'folder',
			folderId: folder.id,
			folderName: folder.name,
			folderColor: folder.color,
		},
	})

	const style = {
		opacity: isDragging ? 0.4 : isAnyDragging ? 0.6 : 1,
	}

	return (
		<div
			ref={(node) => {
				setDroppableRef(node)
				setDraggableRef(node)
			}}
			style={style}
			className={cn(
				'rounded-lg transition-colors',
				isOver && 'ring-2 ring-primary bg-primary/5',
			)}
			{...attributes}
			{...listeners}
		>
			<FolderCard folder={folder} onEdit={onEdit} onDelete={onDelete} />
		</div>
	)
}
