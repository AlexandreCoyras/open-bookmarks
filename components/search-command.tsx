'use client'

import { ExternalLink, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
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

export function SearchCommand() {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const router = useRouter()

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
				<span className="hidden sm:inline">Rechercher...</span>
				<kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
					<span className="text-xs">&#8984;</span>K
				</kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={handleOpenChange}>
				<CommandInput
					placeholder="Rechercher des dossiers et favoris..."
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					{isLoading && debouncedQuery.length >= 2 && (
						<div className="py-6 text-center text-sm text-muted-foreground">
							Recherche...
						</div>
					)}
					{showEmpty && <CommandEmpty>Aucun résultat.</CommandEmpty>}
					{data && data.folders.length > 0 && (
						<CommandGroup heading="Dossiers">
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
						<CommandGroup heading="Favoris">
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
									{b.folderName && (
										<span className="ml-auto text-xs text-muted-foreground shrink-0">
											{b.folderName}
										</span>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>
			</CommandDialog>
		</>
	)
}
