'use client'

import { FolderPlus, Plus, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { BookmarkForm } from '@/components/bookmark-form'
import { BookmarkList } from '@/components/bookmark-list'
import { BookmarksAreaContextMenu } from '@/components/bookmarks-area-context-menu'
import { DndProvider } from '@/components/dnd-provider'
import { FolderForm } from '@/components/folder-form'
import { FolderList } from '@/components/folder-list'
import { ImportDialog } from '@/components/import-dialog'
import { SharedFoldersSection } from '@/components/shared-folders-section'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCreateBookmark } from '@/lib/hooks/use-bookmarks'
import { useCreateFolder } from '@/lib/hooks/use-folders'
import { useImportBookmarks } from '@/lib/hooks/use-import'

export function HomeContent() {
	const t = useTranslations('Dashboard')
	const tBookmark = useTranslations('Bookmark')
	const tFolder = useTranslations('Folder')
	const tImport = useTranslations('Import')
	const [bookmarkFormOpen, setBookmarkFormOpen] = useState(false)
	const [folderFormOpen, setFolderFormOpen] = useState(false)
	const [importDialogOpen, setImportDialogOpen] = useState(false)
	const createBookmark = useCreateBookmark()
	const createFolder = useCreateFolder()
	const importBookmarks = useImportBookmarks()

	async function handleCreateBookmark(data: {
		url: string
		title: string
		description?: string
		favicon?: string
	}) {
		await createBookmark.mutateAsync(data)
		setBookmarkFormOpen(false)
		toast.success(tBookmark('bookmarkAdded'))
	}

	async function handleCreateFolder(data: {
		name: string
		color?: string
		icon?: string | null
	}) {
		await createFolder.mutateAsync(data)
		setFolderFormOpen(false)
		toast.success(tFolder('folderCreated'))
	}

	async function handleImport(html: string) {
		const result = await importBookmarks.mutateAsync({ html })
		setImportDialogOpen(false)
		toast.success(
			tImport('importSuccess', {
				bookmarks: result.bookmarksCreated,
				folders: result.foldersCreated,
			}),
		)
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-semibold text-xl">{t('myBookmarks')}</h2>
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => setImportDialogOpen(true)}
					>
						<Upload className="size-4" />
						<span className="hidden sm:inline">{t('import')}</span>
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setFolderFormOpen(true)}
					>
						<FolderPlus className="size-4" />
						<span className="hidden sm:inline">{t('newFolder')}</span>
					</Button>
					<Button size="sm" onClick={() => setBookmarkFormOpen(true)}>
						<Plus className="size-4" />
						<span className="hidden sm:inline">{t('addBookmark')}</span>
					</Button>
				</div>
			</div>

			<BookmarksAreaContextMenu
				onNewFolder={() => setFolderFormOpen(true)}
				onAddBookmark={() => setBookmarkFormOpen(true)}
				onImport={() => setImportDialogOpen(true)}
			>
				<div className="min-h-[calc(100vh-12rem)] space-y-4 sm:space-y-6">
					<DndProvider>
						<FolderList />

						<Separator className="my-6" />

						<BookmarkList />
					</DndProvider>

					<SharedFoldersSection />
				</div>
			</BookmarksAreaContextMenu>

			<BookmarkForm
				open={bookmarkFormOpen}
				onOpenChange={setBookmarkFormOpen}
				onSubmit={handleCreateBookmark}
				loading={createBookmark.isPending}
			/>

			<FolderForm
				open={folderFormOpen}
				onOpenChange={setFolderFormOpen}
				onSubmit={handleCreateFolder}
				loading={createFolder.isPending}
			/>

			<ImportDialog
				open={importDialogOpen}
				onOpenChange={setImportDialogOpen}
				onImport={handleImport}
				loading={importBookmarks.isPending}
			/>
		</div>
	)
}
