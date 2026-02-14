'use client'

import { type FormEvent, useEffect, useState } from 'react'
import type { BookmarkData } from '@/components/bookmark-card'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type BookmarkFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: {
		url: string
		title: string
		description?: string
		favicon?: string
		folderId?: string
	}) => void
	defaultValues?: Partial<BookmarkData>
	loading?: boolean
}

export function BookmarkForm({
	open,
	onOpenChange,
	onSubmit,
	defaultValues,
	loading,
}: BookmarkFormProps) {
	const [url, setUrl] = useState('')
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')

	useEffect(() => {
		if (open) {
			setUrl(defaultValues?.url ?? '')
			setTitle(defaultValues?.title ?? '')
			setDescription(defaultValues?.description ?? '')
		}
	}, [open, defaultValues])

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		onSubmit({
			url,
			title,
			description: description || undefined,
			favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
			folderId: defaultValues?.folderId ?? undefined,
		})
	}

	const isEditing = !!defaultValues?.id

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? 'Modifier le favori' : 'Ajouter un favori'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="url">URL</Label>
						<Input
							id="url"
							type="url"
							placeholder="https://exemple.com"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="title">Titre</Label>
						<Input
							id="title"
							placeholder="Mon site"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							placeholder="Description optionnelle"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={loading}>
							{loading
								? 'Enregistrement...'
								: isEditing
									? 'Modifier'
									: 'Ajouter'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
