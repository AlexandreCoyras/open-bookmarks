'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { BookmarkData } from '@/components/bookmark-card'
import { BookmarkForm } from '@/components/bookmark-form'
import { DndBookmarkList } from '@/components/dnd-bookmark-list'
import { useDndItems } from '@/components/dnd-provider'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteBookmark, useUpdateBookmark } from '@/lib/hooks/use-bookmarks'

export function BookmarkList() {
	const { items, folderId, parentFolderId } = useDndItems()
	const isLoading = false
	const updateBookmark = useUpdateBookmark()
	const deleteBookmark = useDeleteBookmark()

	const [formOpen, setFormOpen] = useState(false)
	const [editingBookmark, setEditingBookmark] = useState<BookmarkData | null>(
		null,
	)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	function handleEdit(bookmark: BookmarkData) {
		setEditingBookmark(bookmark)
		setFormOpen(true)
	}

	async function handleSubmit(data: {
		url: string
		title: string
		description?: string
		favicon?: string
		folderId?: string
	}) {
		if (editingBookmark?.id) {
			await updateBookmark.mutateAsync({ id: editingBookmark.id, ...data })
			toast.success('Favori modifie')
		}
		setFormOpen(false)
		setEditingBookmark(null)
	}

	async function handleDelete() {
		if (!deletingId) return
		await deleteBookmark.mutateAsync(deletingId)
		setDeletingId(null)
		toast.success('Favori supprime')
	}

	async function handleRemoveFromFolder(id: string) {
		try {
			await updateBookmark.mutateAsync({
				id,
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
	}

	if (isLoading) {
		return (
			<div className="grid gap-2">
				{['a', 'b', 'c'].map((key) => (
					<Skeleton key={key} className="h-16 w-full rounded-lg" />
				))}
			</div>
		)
	}

	return (
		<>
			{items.length > 0 ? (
				<DndBookmarkList
					onEdit={handleEdit}
					onDelete={(id) => setDeletingId(id)}
					onRemoveFromFolder={folderId ? handleRemoveFromFolder : undefined}
				/>
			) : (
				<p className="text-sm text-muted-foreground py-4 text-center">
					Aucun favori pour le moment.
				</p>
			)}

			<BookmarkForm
				open={formOpen}
				onOpenChange={setFormOpen}
				onSubmit={handleSubmit}
				defaultValues={editingBookmark ?? undefined}
				loading={updateBookmark.isPending}
			/>

			<AlertDialog
				open={!!deletingId}
				onOpenChange={(open) => !open && setDeletingId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Supprimer ce favori ?</AlertDialogTitle>
						<AlertDialogDescription>
							Cette action est irreversible.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Annuler</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Supprimer
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
