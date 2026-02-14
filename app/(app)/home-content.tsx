'use client'

import { FolderPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { BookmarkForm } from '@/components/bookmark-form'
import { BookmarkList } from '@/components/bookmark-list'
import { DndProvider } from '@/components/dnd-provider'
import { FolderForm } from '@/components/folder-form'
import { FolderList } from '@/components/folder-list'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCreateBookmark } from '@/lib/hooks/use-bookmarks'
import { useCreateFolder } from '@/lib/hooks/use-folders'

export function HomeContent() {
	const [bookmarkFormOpen, setBookmarkFormOpen] = useState(false)
	const [folderFormOpen, setFolderFormOpen] = useState(false)
	const createBookmark = useCreateBookmark()
	const createFolder = useCreateFolder()

	async function handleCreateBookmark(data: {
		url: string
		title: string
		description?: string
		favicon?: string
	}) {
		await createBookmark.mutateAsync(data)
		setBookmarkFormOpen(false)
		toast.success('Favori ajoute')
	}

	async function handleCreateFolder(data: { name: string; color?: string }) {
		await createFolder.mutateAsync(data)
		setFolderFormOpen(false)
		toast.success('Dossier cree')
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-semibold text-xl">Mes favoris</h2>
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => setFolderFormOpen(true)}
					>
						<FolderPlus className="mr-1 size-4" />
						Nouveau dossier
					</Button>
					<Button size="sm" onClick={() => setBookmarkFormOpen(true)}>
						<Plus className="mr-1 size-4" />
						Ajouter un favori
					</Button>
				</div>
			</div>

			<DndProvider>
				<FolderList />

				<Separator className="my-6" />

				<BookmarkList />
			</DndProvider>

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
		</div>
	)
}
