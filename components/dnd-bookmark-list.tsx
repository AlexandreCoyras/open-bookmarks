'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { BookmarkData } from '@/components/bookmark-card'
import { useDndItems } from '@/components/dnd-provider'
import { SortableBookmark } from '@/components/sortable-bookmark'

export function DndBookmarkList({
	onEdit,
	onDelete,
	onRemoveFromFolder,
	selectionMode,
	selectedIds,
	onToggleSelect,
}: {
	onEdit?: (bookmark: BookmarkData) => void
	onDelete?: (id: string) => void
	onRemoveFromFolder?: (id: string) => void
	selectionMode?: boolean
	selectedIds?: Set<string>
	onToggleSelect?: (id: string) => void
}) {
	const { items } = useDndItems()

	if (items.length === 0) return null

	return (
		<SortableContext
			items={items.map((b) => b.id)}
			strategy={verticalListSortingStrategy}
		>
			<div className="grid gap-2">
				{items.map((bookmark) => (
					<SortableBookmark
						key={bookmark.id}
						bookmark={bookmark}
						onEdit={onEdit ? () => onEdit(bookmark) : undefined}
						onDelete={onDelete ? () => onDelete(bookmark.id) : undefined}
						onRemoveFromFolder={
							onRemoveFromFolder
								? () => onRemoveFromFolder(bookmark.id)
								: undefined
						}
						selectionMode={selectionMode}
						selected={selectedIds?.has(bookmark.id)}
						onToggleSelect={
							onToggleSelect ? () => onToggleSelect(bookmark.id) : undefined
						}
					/>
				))}
			</div>
		</SortableContext>
	)
}
