'use client'

import { ExternalLink, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { getFolderIcon } from '@/lib/folder-icons'
import { useSearch } from '@/lib/hooks/use-search'
import { useRouter } from '@/lib/navigation'

export function SearchCommand() {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const router = useRouter()
	const t = useTranslations('Search')

	const { data, isLoading } = useSearch(debouncedQuery, open)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query)
		}, 300)
		return () => clearTimeout(timer)
	}, [query])

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((prev) => !prev)
			}
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [])

	const handleOpenChange = useCallback((value: boolean) => {
		setOpen(value)
		if (!value) {
			setQuery('')
			setDebouncedQuery('')
		}
	}, [])

	function handleSelectFolder(folderId: string) {
		setOpen(false)
		router.push(`/dashboard/folders/${folderId}`)
	}

	function handleSelectBookmark(url: string) {
		setOpen(false)
		window.open(url, '_blank', 'noopener,noreferrer')
	}

	const hasResults =
		data && (data.folders.length > 0 || data.bookmarks.length > 0)
	const showEmpty = debouncedQuery.length >= 2 && !isLoading && !hasResults

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				className="gap-2 text-muted-foreground"
				onClick={() => setOpen(true)}
			>
				<Search className="size-4" />
				<span className="hidden sm:inline">{t('searchPlaceholder')}</span>
				<kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
					<span className="text-xs">&#8984;</span>K
				</kbd>
			</Button>
			<CommandDialog
				open={open}
				onOpenChange={handleOpenChange}
				shouldFilter={false}
			>
				<CommandInput
					placeholder={t('searchInputPlaceholder')}
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					{isLoading && debouncedQuery.length >= 2 && (
						<div className="py-6 text-center text-sm text-muted-foreground">
							{t('searching')}
						</div>
					)}
					{showEmpty && <CommandEmpty>{t('noResults')}</CommandEmpty>}
					{data && data.folders.length > 0 && (
						<CommandGroup heading={t('folders')}>
							{data.folders.map((f) => {
								const Icon = getFolderIcon(f.icon)
								return (
									<CommandItem
										key={f.id}
										value={`folder-${f.id}-${f.name}`}
										onSelect={() => handleSelectFolder(f.id)}
									>
										<Icon
											className="size-4 shrink-0"
											style={{
												color: f.color ?? undefined,
											}}
										/>
										<span className="truncate">{f.name}</span>
										{f.parentName && (
											<span className="ml-auto text-xs text-muted-foreground truncate">
												{f.parentName}
											</span>
										)}
									</CommandItem>
								)
							})}
						</CommandGroup>
					)}
					{data && data.bookmarks.length > 0 && (
						<CommandGroup heading={t('bookmarks')}>
							{data.bookmarks.map((b) => (
								<CommandItem
									key={b.id}
									value={`bookmark-${b.id}-${b.title}-${b.url}`}
									onSelect={() => handleSelectBookmark(b.url)}
								>
									{b.favicon ? (
										// biome-ignore lint/performance/noImgElement: external favicon domains
										<img
											src={b.favicon}
											alt=""
											className="size-4 shrink-0 rounded"
										/>
									) : (
										<ExternalLink className="size-4 shrink-0 text-muted-foreground" />
									)}
									<div className="min-w-0 flex-1">
										<span className="truncate block text-sm">{b.title}</span>
										<span className="truncate block text-xs text-muted-foreground">
											{b.url}
										</span>
									</div>
									<div className="ml-auto flex items-center gap-1.5 shrink-0">
										{b.matchedTag && (
											<Badge
												variant="secondary"
												className="text-[10px] px-1.5 py-0 h-4"
											>
												{b.matchedTag}
											</Badge>
										)}
										{b.folderName && (
											<span className="text-xs text-muted-foreground">
												{b.folderName}
											</span>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>
			</CommandDialog>
		</>
	)
}
