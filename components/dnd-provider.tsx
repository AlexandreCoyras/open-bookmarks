'use client'

import {
	type CollisionDetection,
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	type Modifier,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Folder } from 'lucide-react'
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useId,
	useState,
} from 'react'
import { toast } from 'sonner'
import { BookmarkCard, type BookmarkData } from '@/components/bookmark-card'
import { Card, CardContent } from '@/components/ui/card'
import {
	useBookmarks,
	useReorderBookmarks,
	useUpdateBookmark,
} from '@/lib/hooks/use-bookmarks'
import { useUpdateFolder } from '@/lib/hooks/use-folders'

type DndBookmarkContextValue = {
	items: BookmarkData[]
	folderId?: string
	parentFolderId?: string | null
	isDragging: boolean
}

const DndBookmarkContext = createContext<DndBookmarkContextValue>({
	items: [],
	isDragging: false,
})

export function useDndItems() {
	return useContext(DndBookmarkContext)
}

type ActiveDragItem =
	| { type: 'bookmark'; bookmark: BookmarkData }
	| {
			type: 'folder'
			folderId: string
			folderName: string
			folderColor: string | null
	  }

/**
 * Centers the DragOverlay on the cursor when the overlay is smaller than the source element.
 */
const snapCenterToCursor: Modifier = ({
	activatorEvent,
	draggingNodeRect,
	transform,
}) => {
	if (draggingNodeRect && activatorEvent && 'clientX' in activatorEvent) {
		const event = activatorEvent as PointerEvent
		const offsetX = event.clientX - draggingNodeRect.left
		const offsetY = event.clientY - draggingNodeRect.top

		return {
			...transform,
			x: transform.x + offsetX - draggingNodeRect.width / 2,
			y: transform.y + offsetY - draggingNodeRect.height / 2,
		}
	}

	return transform
}

export function DndProvider({
	children,
	folderId,
	parentFolderId,
}: {
	children: ReactNode
	folderId?: string
	parentFolderId?: string | null
}) {
	const dndId = useId()
	const { data: bookmarks } = useBookmarks(folderId)
	const serverItems = (bookmarks ?? []) as BookmarkData[]

	const [localItems, setLocalItems] = useState<BookmarkData[]>(serverItems)
	const reorderBookmarks = useReorderBookmarks()
	const updateBookmark = useUpdateBookmark()
	const updateFolder = useUpdateFolder()
	const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(
		null,
	)

	// Sync local state when server data changes (initial load, refetch)
	useEffect(() => {
		setLocalItems((bookmarks ?? []) as BookmarkData[])
	}, [bookmarks])

	// Pointer-based detection for droppable targets (folders),
	// closestCenter for sortable items (bookmark reorder)
	const collisionDetection: CollisionDetection = (args) => {
		const pointerCollisions = pointerWithin(args)
		const droppableHit = pointerCollisions.find(
			(c) => c.data?.droppableContainer?.data?.current?.type,
		)
		if (droppableHit) return [droppableHit]
		return closestCenter(args)
	}

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	)

	function handleDragStart(event: DragStartEvent) {
		const activeData = event.active.data.current
		if (activeData?.type === 'folder') {
			setActiveDragItem({
				type: 'folder',
				folderId: activeData.folderId,
				folderName: activeData.folderName,
				folderColor: activeData.folderColor,
			})
		} else {
			const bookmark = localItems.find((b) => b.id === event.active.id)
			if (bookmark) {
				setActiveDragItem({ type: 'bookmark', bookmark })
			}
		}
	}

	async function handleDragEnd(event: DragEndEvent) {
		const currentDragItem = activeDragItem
		setActiveDragItem(null)
		const { active, over } = event

		if (!over) return

		const overData = over.data.current
		const activeData = active.data.current

		// Drop onto a folder target (folder card or breadcrumb item)
		if (overData?.type === 'folder') {
			// Dragging a folder onto a folder target
			if (activeData?.type === 'folder') {
				const draggedFolderId = activeData.folderId as string
				const targetFolderId = overData.folderId as string | null

				// Don't drop a folder onto itself
				if (draggedFolderId === targetFolderId) return

				try {
					await updateFolder.mutateAsync({
						id: draggedFolderId,
						parentId: targetFolderId,
					})
					toast.success('Dossier deplace')
				} catch {
					toast.error('Erreur lors du deplacement du dossier')
				}
				return
			}

			// Dragging a bookmark onto a folder target
			try {
				await updateBookmark.mutateAsync({
					id: active.id as string,
					folderId: overData.folderId,
				})
				toast.success('Favori deplace dans le dossier')
			} catch {
				toast.error('Erreur lors du deplacement')
			}
			return
		}

		// Bookmark reorder (only for bookmark-type drags)
		if (currentDragItem?.type === 'bookmark' && active.id !== over.id) {
			const oldIndex = localItems.findIndex((b) => b.id === active.id)
			const newIndex = localItems.findIndex((b) => b.id === over.id)

			if (oldIndex === -1 || newIndex === -1) return

			const reordered = arrayMove(localItems, oldIndex, newIndex)
			const previous = localItems

			// Update local state synchronously — same render, no snap-back
			setLocalItems(reordered)

			const reorderPayload = reordered.map((b, i) => ({
				id: b.id,
				position: i,
				folderId: b.folderId,
			}))

			try {
				await reorderBookmarks.mutateAsync(reorderPayload)
			} catch {
				setLocalItems(previous)
				toast.error('Erreur lors du reordonnancement')
			}
		}
	}

	const isDragging = activeDragItem !== null

	return (
		<DndBookmarkContext.Provider
			value={{ items: localItems, folderId, parentFolderId, isDragging }}
		>
			<DndContext
				id={dndId}
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{children}
				<DragOverlay modifiers={[snapCenterToCursor]}>
					{activeDragItem?.type === 'bookmark' ? (
						<div className="w-64 scale-90 opacity-90">
							<BookmarkCard
								bookmark={activeDragItem.bookmark}
								onEdit={() => {}}
								onDelete={() => {}}
							/>
						</div>
					) : activeDragItem?.type === 'folder' ? (
						<Card className="w-48 opacity-90">
							<CardContent className="flex items-center gap-3 p-2">
								<Folder
									className="size-4 shrink-0"
									style={{
										color: activeDragItem.folderColor ?? undefined,
									}}
								/>
								<span className="font-medium text-sm truncate">
									{activeDragItem.folderName}
								</span>
							</CardContent>
						</Card>
					) : null}
				</DragOverlay>
			</DndContext>
		</DndBookmarkContext.Provider>
	)
}
