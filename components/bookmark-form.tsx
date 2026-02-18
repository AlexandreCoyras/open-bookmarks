'use client'

import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useEffect, useState } from 'react'
import type { BookmarkData } from '@/components/bookmark-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { useTags } from '@/lib/hooks/use-tags'
import { cn } from '@/lib/utils'

type BookmarkFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: {
		url: string
		title: string
		description?: string
		favicon?: string
		folderId?: string
		tags?: string[]
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
	const [tags, setTags] = useState<string[]>([])
	const [comboboxOpen, setComboboxOpen] = useState(false)
	const [search, setSearch] = useState('')
	const t = useTranslations('Bookmark')

	const { data: allTags } = useTags()

	useEffect(() => {
		if (open) {
			setUrl(defaultValues?.url ?? '')
			setTitle(defaultValues?.title ?? '')
			setDescription(defaultValues?.description ?? '')
			setTags(defaultValues?.tags?.map((t) => t.name) ?? [])
			setSearch('')
		}
	}, [open, defaultValues])

	function toggleTag(name: string) {
		const normalized = name.trim().toLowerCase()
		if (!normalized) return
		setTags((prev) =>
			prev.includes(normalized)
				? prev.filter((t) => t !== normalized)
				: [...prev, normalized],
		)
	}

	function createTag() {
		const normalized = search.trim().toLowerCase()
		if (normalized && !tags.includes(normalized)) {
			setTags((prev) => [...prev, normalized])
		}
		setSearch('')
	}

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		onSubmit({
			url,
			title,
			description: description || undefined,
			favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
			folderId: defaultValues?.folderId ?? undefined,
			tags,
		})
	}

	const isEditing = !!defaultValues?.id

	const availableTags = (allTags ?? []).filter(
		(t) => !search || t.name.includes(search.toLowerCase()),
	)
	const searchNormalized = search.trim().toLowerCase()
	const canCreate =
		searchNormalized.length > 0 &&
		!tags.includes(searchNormalized) &&
		!(allTags ?? []).some((t) => t.name === searchNormalized)

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
					<div className="grid gap-2">
						<Label>{t('tagsLabel')}</Label>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{tags.map((tag) => (
									<Badge key={tag} variant="secondary" className="gap-1 pr-1">
										{tag}
										<button
											type="button"
											onClick={() => toggleTag(tag)}
											className="hover:bg-muted-foreground/20 rounded-full"
										>
											<X className="size-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
						<Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className="justify-between font-normal"
								>
									<span className="text-muted-foreground">
										{t('tagsPlaceholder')}
									</span>
									<ChevronsUpDown className="size-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-[var(--radix-popover-trigger-width)] p-0"
								align="start"
							>
								<Command shouldFilter={false}>
									<CommandInput
										placeholder={t('tagsPlaceholder')}
										value={search}
										onValueChange={setSearch}
									/>
									<CommandList>
										<CommandEmpty>{t('noTagsFound')}</CommandEmpty>
										{availableTags.length > 0 && (
											<CommandGroup>
												{availableTags.map((tag) => (
													<CommandItem
														key={tag.id}
														value={tag.name}
														onSelect={() => toggleTag(tag.name)}
													>
														<Check
															className={cn(
																'size-4',
																tags.includes(tag.name)
																	? 'opacity-100'
																	: 'opacity-0',
															)}
														/>
														{tag.name}
													</CommandItem>
												))}
											</CommandGroup>
										)}
										{canCreate && (
											<CommandGroup>
												<CommandItem onSelect={createTag}>
													<Plus className="size-4" />
													{t('createTag', { name: searchNormalized })}
												</CommandItem>
											</CommandGroup>
										)}
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
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
