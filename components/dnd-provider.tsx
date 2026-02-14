'use client'

import {
	type CollisionDetection,
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'
import { toast } from 'sonner'
import { BookmarkCard, type BookmarkData } from '@/components/bookmark-card'
import {
	useBookmarks,
	useReorderBookmarks,
	useUpdateBookmark,
} from '@/lib/hooks/use-bookmarks'

type DndBookmarkContextValue = {
	items: BookmarkData[]
}

const DndBookmarkContext = createContext<DndBookmarkContextValue>({ items: [] })

export function useDndItems() {
	return useContext(DndBookmarkContext)
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
	const { data: bookmarks } = useBookmarks(folderId)
	const serverItems = (bookmarks ?? []) as BookmarkData[]

	const [localItems, setLocalItems] = useState<BookmarkData[]>(serverItems)
	const reorderBookmarks = useReorderBookmarks()
	const updateBookmark = useUpdateBookmark()
	const [activeBookmark, setActiveBookmark] = useState<BookmarkData | null>(
		null,
	)

	// Sync local state when server data changes (initial load, refetch)
	useEffect(() => {
		setLocalItems((bookmarks ?? []) as BookmarkData[])
	}, [bookmarks])

	// Pointer-based detection for droppable targets (folders/root),
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
		const active = localItems.find((b) => b.id === event.active.id)
		setActiveBookmark(active ?? null)
	}

	async function handleDragEnd(event: DragEndEvent) {
		setActiveBookmark(null)
		const { active, over } = event

		if (!over) return

		const overData = over.data.current
		if (overData?.type === 'root') {
			try {
				await updateBookmark.mutateAsync({
					id: active.id as string,
					folderId: parentFolderId ?? null,
				})
				toast.success(
					parentFolderId
						? 'Favori deplace dans le dossier parent'
						: 'Favori deplace a la racine',
				)
			} catch {
				toast.error('Erreur lors du deplacement')
			}
			return
		}

		if (overData?.type === 'folder') {
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

		if (active.id !== over.id) {
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

	return (
		<DndBookmarkContext.Provider value={{ items: localItems }}>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{children}
				<DragOverlay>
					{activeBookmark ? (
						<BookmarkCard
							bookmark={activeBookmark}
							onEdit={() => {}}
							onDelete={() => {}}
						/>
					) : null}
				</DragOverlay>
			</DndContext>
		</DndBookmarkContext.Provider>
	)
}
