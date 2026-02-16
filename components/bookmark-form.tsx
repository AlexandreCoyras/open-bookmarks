'use client'

import { useTranslations } from 'next-intl'
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
	const t = useTranslations('Bookmark')

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
						{isEditing ? t('editBookmark') : t('addBookmark')}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="url">{t('urlLabel')}</Label>
						<Input
							id="url"
							type="url"
							placeholder={t('urlPlaceholder')}
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="title">{t('titleLabel')}</Label>
						<Input
							id="title"
							placeholder={t('titlePlaceholder')}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">{t('descriptionLabel')}</Label>
						<Input
							id="description"
							placeholder={t('descriptionPlaceholder')}
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
							{t('cancel')}
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? t('saving') : isEditing ? t('edit') : t('add')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
