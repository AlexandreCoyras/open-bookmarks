'use client'

import { FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AddBookmarkButton } from '@/components/add-bookmark-button'
import { BookmarkList } from '@/components/bookmark-list'
import { BreadcrumbNav } from '@/components/breadcrumb-nav'
import { DndProvider } from '@/components/dnd-provider'
import { DroppableRoot } from '@/components/droppable-root'
import { FolderForm } from '@/components/folder-form'
import { FolderList } from '@/components/folder-list'
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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
	useCreateFolder,
	useDeleteFolder,
	useFolder,
	useUpdateFolder,
} from '@/lib/hooks/use-folders'

export default function FolderPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const { data: folder, isLoading } = useFolder(id)
	const updateFolder = useUpdateFolder()
	const deleteFolder = useDeleteFolder()
	const createFolder = useCreateFolder()

	const [editOpen, setEditOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [newFolderOpen, setNewFolderOpen] = useState(false)

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-8 w-64" />
			</div>
		)
	}

	if (!folder || typeof folder !== 'object' || !('id' in folder)) {
		return <p className="text-muted-foreground">Dossier introuvable.</p>
	}

	async function handleEditFolder(data: {
		name: string
		color?: string
		parentId?: string
	}) {
		await updateFolder.mutateAsync({ id, ...data })
		setEditOpen(false)
		toast.success('Dossier modifie')
	}

	async function handleDeleteFolder() {
		await deleteFolder.mutateAsync(id)
		setDeleteOpen(false)
		router.push('/')
		toast.success('Dossier supprime')
	}

	async function handleCreateSubfolder(data: {
		name: string
		color?: string
		parentId?: string
	}) {
		await createFolder.mutateAsync({ ...data, parentId: id })
		setNewFolderOpen(false)
		toast.success('Sous-dossier cree')
	}

	return (
		<div className="space-y-6">
			<BreadcrumbNav currentName={folder.name} parentId={folder.parentId} />

			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-xl">{folder.name}</h2>
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => setNewFolderOpen(true)}
					>
						<FolderPlus className="mr-1 size-4" />
						Sous-dossier
					</Button>
					<AddBookmarkButton folderId={id} />
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => setEditOpen(true)}
					>
						<Pencil className="size-4" />
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => setDeleteOpen(true)}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</div>

			<DndProvider folderId={id}>
				<DroppableRoot />

				<FolderList parentId={id} />

				<Separator className="my-6" />

				<BookmarkList />
			</DndProvider>

			<FolderForm
				open={editOpen}
				onOpenChange={setEditOpen}
				onSubmit={handleEditFolder}
				defaultValues={folder}
				loading={updateFolder.isPending}
			/>

			<FolderForm
				open={newFolderOpen}
				onOpenChange={setNewFolderOpen}
				onSubmit={handleCreateSubfolder}
				defaultValues={{ parentId: id } as never}
				loading={createFolder.isPending}
			/>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
						<AlertDialogDescription>
							Les sous-dossiers seront egalement supprimes. Les favoris contenus
							seront deplaces a la racine.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Annuler</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteFolder}>
							Supprimer
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
