'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookmarkCard, type BookmarkData } from '@/components/bookmark-card'

export function SortableBookmark({
	bookmark,
	onEdit,
	onDelete,
}: {
	bookmark: BookmarkData
	onEdit: () => void
	onDelete: () => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: bookmark.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<BookmarkCard bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} />
		</div>
	)
}
