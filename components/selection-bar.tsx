'use client'

import { FolderInput, Trash2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { FolderPickerDialog } from '@/components/folder-picker-dialog'
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
import {
	useBulkDeleteBookmarks,
	useBulkMoveBookmarks,
} from '@/lib/hooks/use-bookmarks'

export function SelectionBar({
	selectedIds,
	onClear,
	currentFolderId,
}: {
	selectedIds: Set<string>
	onClear: () => void
	currentFolderId?: string | null
}) {
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [moveOpen, setMoveOpen] = useState(false)
	const bulkDelete = useBulkDeleteBookmarks()
	const bulkMove = useBulkMoveBookmarks()
	const t = useTranslations('Selection')

	const count = selectedIds.size
	if (count === 0) return null

	async function handleDelete() {
		await bulkDelete.mutateAsync([...selectedIds])
		setDeleteOpen(false)
		onClear()
		toast.success(
			count > 1 ? t('deletedPlural', { count }) : t('deleted', { count }),
		)
	}

	async function handleMove(folderId: string | null) {
		await bulkMove.mutateAsync({ ids: [...selectedIds], folderId })
		setMoveOpen(false)
		onClear()
		toast.success(
			count > 1 ? t('movedPlural', { count }) : t('moved', { count }),
		)
	}

	return (
		<>
			<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg">
				<span className="text-sm font-medium whitespace-nowrap">
					{count > 1
						? t('selectedPlural', { count })
						: t('selected', { count })}
				</span>
				<div className="h-4 w-px bg-border" />
				<Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>
					<FolderInput className="size-4" />
					<span className="hidden sm:inline">{t('move')}</span>
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="text-destructive"
					onClick={() => setDeleteOpen(true)}
				>
					<Trash2 className="size-4" />
					<span className="hidden sm:inline">{t('delete')}</span>
				</Button>
				<div className="h-4 w-px bg-border" />
				<Button size="icon-sm" variant="ghost" onClick={onClear}>
					<X className="size-4" />
				</Button>
			</div>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{count > 1
								? t('deleteTitlePlural', { count })
								: t('deleteTitle', { count })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							{t('confirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<FolderPickerDialog
				open={moveOpen}
				onOpenChange={setMoveOpen}
				onSelect={handleMove}
				currentFolderId={currentFolderId}
			/>
		</>
	)
}
