'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { BookmarkData } from '@/components/bookmark-card'
import { BookmarkForm } from '@/components/bookmark-form'
import { Button } from '@/components/ui/button'
import { useCreateBookmark } from '@/lib/hooks/use-bookmarks'

export function AddBookmarkButton({ folderId }: { folderId?: string }) {
	const [open, setOpen] = useState(false)
	const createBookmark = useCreateBookmark()

	async function handleSubmit(data: {
		url: string
		title: string
		description?: string
		favicon?: string
		folderId?: string
		tags?: string[]
	}) {
		await createBookmark.mutateAsync(data)
		setOpen(false)
		toast.success('Favori ajoute')
	}

	const defaultValues = folderId
		? ({ folderId } as Partial<BookmarkData>)
		: undefined

	return (
		<>
			<Button size="sm" onClick={() => setOpen(true)}>
				<Plus className="mr-1 size-4" />
				Ajouter un favori
			</Button>
			<BookmarkForm
				open={open}
				onOpenChange={setOpen}
				onSubmit={handleSubmit}
				defaultValues={defaultValues}
				loading={createBookmark.isPending}
			/>
		</>
	)
}
