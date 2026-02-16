'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { DroppableFolder } from '@/components/droppable-folder'
import type { FolderData } from '@/components/folder-card'
import { FolderForm } from '@/components/folder-form'
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
import {
	useDeleteFolder,
	useFolders,
	useUpdateFolder,
} from '@/lib/hooks/use-folders'

export function FolderList({
	parentId,
	readOnly,
}: {
	parentId?: string
	readOnly?: boolean
}) {
	const { data: folders, isLoading } = useFolders(parentId)
	const updateFolder = useUpdateFolder()
	const deleteFolder = useDeleteFolder()
	const t = useTranslations('Folder')
	const td = useTranslations('DeleteFolder')

	const [formOpen, setFormOpen] = useState(false)
	const [editingFolder, setEditingFolder] = useState<FolderData | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	function handleEdit(folder: FolderData) {
		setEditingFolder(folder)
		setFormOpen(true)
	}

	async function handleSubmit(data: {
		name: string
		color?: string
		parentId?: string
	}) {
		if (editingFolder?.id) {
			await updateFolder.mutateAsync({ id: editingFolder.id, ...data })
			toast.success(t('folderUpdated'))
		}
		setFormOpen(false)
		setEditingFolder(null)
	}

	async function handleDelete() {
		if (!deletingId) return
		await deleteFolder.mutateAsync(deletingId)
		setDeletingId(null)
		toast.success(t('folderDeleted'))
	}

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
				{['a', 'b', 'c', 'd'].map((key) => (
					<Skeleton key={key} className="h-12 w-full rounded-lg" />
				))}
			</div>
		)
	}

	return (
		<>
			{folders && folders.length > 0 && (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
					{folders.map((folder) => (
						<DroppableFolder
							key={folder.id}
							folder={folder as FolderData}
							onEdit={
								readOnly ? undefined : () => handleEdit(folder as FolderData)
							}
							onDelete={readOnly ? undefined : () => setDeletingId(folder.id)}
							readOnly={readOnly}
						/>
					))}
				</div>
			)}

			<FolderForm
				open={formOpen}
				onOpenChange={setFormOpen}
				onSubmit={handleSubmit}
				defaultValues={editingFolder ?? undefined}
				loading={updateFolder.isPending}
			/>

			<AlertDialog
				open={!!deletingId}
				onOpenChange={(open) => !open && setDeletingId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{td('title')}</AlertDialogTitle>
						<AlertDialogDescription>{td('description')}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{td('cancel')}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							{td('confirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

export { FolderList as default }
