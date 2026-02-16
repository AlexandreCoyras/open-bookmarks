'use client'

import { FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { BookmarkForm } from '@/components/bookmark-form'
import { BookmarkList } from '@/components/bookmark-list'
import { BookmarksAreaContextMenu } from '@/components/bookmarks-area-context-menu'
import { BreadcrumbNav } from '@/components/breadcrumb-nav'
import { CollaboratorsDialog } from '@/components/collaborators-dialog'
import { DndProvider } from '@/components/dnd-provider'
import { FolderForm } from '@/components/folder-form'
import { FolderList } from '@/components/folder-list'
import { ImportDialog } from '@/components/import-dialog'
import { ShareFolderDialog } from '@/components/share-folder-dialog'
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
import { useCreateBookmark } from '@/lib/hooks/use-bookmarks'
import {
	useCreateFolder,
	useDeleteFolder,
	useFolder,
	useUpdateFolder,
} from '@/lib/hooks/use-folders'
import { useImportBookmarks } from '@/lib/hooks/use-import'
import { useRouter } from '@/lib/navigation'

type Access = 'owner' | 'editor' | 'viewer'

export function FolderContent({ id }: { id: string }) {
	const router = useRouter()
	const t = useTranslations('Dashboard')
	const tBookmark = useTranslations('Bookmark')
	const tFolder = useTranslations('Folder')
	const tImport = useTranslations('Import')
	const tDelete = useTranslations('DeleteFolder')
	const { data: folder, isLoading } = useFolder(id)
	const updateFolder = useUpdateFolder()
	const deleteFolder = useDeleteFolder()
	const createFolder = useCreateFolder()
	const createBookmark = useCreateBookmark()
	const importBookmarks = useImportBookmarks()

	const [editOpen, setEditOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [newFolderOpen, setNewFolderOpen] = useState(false)
	const [bookmarkFormOpen, setBookmarkFormOpen] = useState(false)
	const [importDialogOpen, setImportDialogOpen] = useState(false)

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-8 w-64" />
			</div>
		)
	}

	if (!folder || typeof folder !== 'object' || !('id' in folder)) {
		return <p className="text-muted-foreground">{t('folderNotFound')}</p>
	}

	const access: Access = (folder as { access?: Access }).access ?? 'owner'
	const isOwner = access === 'owner'
	const canEdit = access === 'owner' || access === 'editor'

	async function handleEditFolder(data: {
		name: string
		color?: string
		icon?: string | null
		parentId?: string
	}) {
		await updateFolder.mutateAsync({ id, ...data })
		setEditOpen(false)
		toast.success(tFolder('folderUpdated'))
	}

	async function handleDeleteFolder() {
		await deleteFolder.mutateAsync(id)
		setDeleteOpen(false)
		router.push('/dashboard')
		toast.success(tFolder('folderDeleted'))
	}

	async function handleCreateSubfolder(data: {
		name: string
		color?: string
		icon?: string | null
		parentId?: string
	}) {
		await createFolder.mutateAsync({ ...data, parentId: id })
		setNewFolderOpen(false)
		toast.success(tFolder('subfolderCreated'))
	}

	async function handleCreateBookmark(data: {
		url: string
		title: string
		description?: string
		favicon?: string
		folderId?: string
	}) {
		await createBookmark.mutateAsync(data)
		setBookmarkFormOpen(false)
		toast.success(tBookmark('bookmarkAdded'))
	}

	async function handleImport(html: string) {
		const result = await importBookmarks.mutateAsync({ html, folderId: id })
		setImportDialogOpen(false)
		toast.success(
			tImport('importSuccess', {
				bookmarks: result.bookmarksCreated,
				folders: result.foldersCreated,
			}),
		)
	}

	const innerContent = (
		<div className="min-h-[calc(100vh-12rem)] space-y-4 sm:space-y-6">
			<DndProvider
				folderId={id}
				parentFolderId={folder.parentId}
				access={access}
			>
				<BreadcrumbNav currentName={folder.name} folderId={id} />

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h2 className="font-semibold text-xl">{folder.name}</h2>
					<div className="flex gap-2">
						{canEdit && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setNewFolderOpen(true)}
								>
									<FolderPlus className="size-4" />
									<span className="hidden sm:inline">{t('subfolder')}</span>
								</Button>
								<Button size="sm" onClick={() => setBookmarkFormOpen(true)}>
									<Plus className="size-4" />
									<span className="hidden sm:inline">{t('addBookmark')}</span>
								</Button>
							</>
						)}
						{isOwner && (
							<>
								<ShareFolderDialog
									folderId={id}
									publicSlug={folder.publicSlug}
									viewCount={folder.viewCount}
								/>
								<CollaboratorsDialog folderId={id} />
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
							</>
						)}
						{!isOwner && canEdit && (
							<Button
								size="icon-sm"
								variant="ghost"
								onClick={() => setEditOpen(true)}
							>
								<Pencil className="size-4" />
							</Button>
						)}
					</div>
				</div>

				<FolderList parentId={id} readOnly={!canEdit} />

				<Separator className="my-6" />

				<BookmarkList readOnly={!canEdit} />
			</DndProvider>
		</div>
	)

	return (
		<div className="space-y-4 sm:space-y-6">
			{canEdit ? (
				<BookmarksAreaContextMenu
					onNewFolder={() => setNewFolderOpen(true)}
					onAddBookmark={() => setBookmarkFormOpen(true)}
					onImport={() => setImportDialogOpen(true)}
					folderLabel={t('subfolder')}
				>
					{innerContent}
				</BookmarksAreaContextMenu>
			) : (
				innerContent
			)}

			{canEdit && (
				<>
					<BookmarkForm
						open={bookmarkFormOpen}
						onOpenChange={setBookmarkFormOpen}
						onSubmit={handleCreateBookmark}
						defaultValues={{ folderId: id } as never}
						loading={createBookmark.isPending}
					/>

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

					<ImportDialog
						open={importDialogOpen}
						onOpenChange={setImportDialogOpen}
						onImport={handleImport}
						loading={importBookmarks.isPending}
					/>
				</>
			)}

			{isOwner && (
				<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{tDelete('title')}</AlertDialogTitle>
							<AlertDialogDescription>
								{tDelete('description')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{tDelete('cancel')}</AlertDialogCancel>
							<AlertDialogAction onClick={handleDeleteFolder}>
								{tDelete('confirm')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	)
}
