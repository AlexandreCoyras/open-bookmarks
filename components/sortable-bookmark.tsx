'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookmarkCard, type BookmarkData } from '@/components/bookmark-card'
import { useDndItems } from '@/components/dnd-provider'

export function SortableBookmark({
	bookmark,
	onEdit,
	onDelete,
	onRemoveFromFolder,
}: {
	bookmark: BookmarkData
	onEdit: () => void
	onDelete: () => void
	onRemoveFromFolder?: () => void
}) {
	const { isDragging: isAnyDragging } = useDndItems()
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: bookmark.id,
		data: { type: 'bookmark', bookmarkId: bookmark.id },
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : isAnyDragging ? 0.6 : 1,
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<BookmarkCard
				bookmark={bookmark}
				onEdit={onEdit}
				onDelete={onDelete}
				onRemoveFromFolder={onRemoveFromFolder}
			/>
		</div>
	)
}
