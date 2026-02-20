'use client'

import {
	ArrowUpFromLine,
	CheckSquare,
	ExternalLink,
	MoreVertical,
	Pencil,
	Square,
	Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTouchDevice } from '@/lib/hooks/use-touch-device'
import { cn } from '@/lib/utils'

export type BookmarkData = {
	id: string
	url: string
	title: string
	description: string | null
	favicon: string | null
	folderId: string | null
	position: number
	tags?: { id: string; name: string }[]
}

export function BookmarkCard({
	bookmark,
	onEdit,
	onDelete,
	onRemoveFromFolder,
	readOnly,
	selectionMode,
	selected,
	onToggleSelect,
	variant = 'list',
}: {
	bookmark: BookmarkData
	onEdit?: () => void
	onDelete?: () => void
	onRemoveFromFolder?: () => void
	readOnly?: boolean
	selectionMode?: boolean
	selected?: boolean
	onToggleSelect?: () => void
	variant?: 'list' | 'grid'
}) {
	const isTouch = useTouchDevice()
	const t = useTranslations('ContextMenu')
	const isGrid = variant === 'grid'

	let hostname = ''
	if (isGrid) {
		try {
			hostname = new URL(bookmark.url).hostname
		} catch {
			hostname = bookmark.url
		}
	}

	const content = (
		<Card
			className={cn(
				'group relative overflow-hidden',
				selected && 'ring-2 ring-primary',
				isGrid && 'h-full',
			)}
			onClick={selectionMode ? onToggleSelect : undefined}
		>
			<CardContent
				className={cn(
					'min-w-0',
					isGrid
						? 'flex flex-col items-center gap-2 p-3 text-center'
						: 'flex items-center gap-3 p-3',
				)}
			>
				{selectionMode &&
					!isGrid &&
					(selected ? (
						<CheckSquare className="size-5 shrink-0 text-primary" />
					) : (
						<Square className="size-5 shrink-0 text-muted-foreground" />
					))}
				{selectionMode && isGrid && (
					<div className="absolute top-1 left-1 z-10">
						{selected ? (
							<CheckSquare className="size-4 text-primary" />
						) : (
							<Square className="size-4 text-muted-foreground" />
						)}
					</div>
				)}
				{bookmark.favicon ? (
					// biome-ignore lint/performance/noImgElement: external favicon domains
					<img
						src={bookmark.favicon}
						alt=""
						className={cn('shrink-0 rounded', isGrid ? 'size-8' : 'size-5')}
					/>
				) : (
					<ExternalLink
						className={cn(
							'shrink-0 text-muted-foreground',
							isGrid ? 'size-8' : 'size-5',
						)}
					/>
				)}
				<div className={cn('min-w-0', isGrid ? 'w-full' : 'flex-1')}>
					<a
						href={selectionMode ? undefined : bookmark.url}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							'font-medium text-sm block',
							isGrid ? 'line-clamp-2' : 'truncate',
							selectionMode
								? 'cursor-pointer'
								: 'hover:underline after:absolute after:inset-0',
						)}
						onClick={selectionMode ? (e) => e.preventDefault() : undefined}
					>
						{bookmark.title}
					</a>
					{!isGrid && bookmark.description && (
						<p className="text-xs text-muted-foreground truncate">
							{bookmark.description}
						</p>
					)}
					<p className="text-xs text-muted-foreground/60 truncate">
						{isGrid ? hostname : bookmark.url}
					</p>
					{!isGrid && bookmark.tags && bookmark.tags.length > 0 && (
						<div className="flex gap-1 flex-wrap mt-1">
							{bookmark.tags.map((tag) => (
								<Badge
									key={tag.id}
									variant="secondary"
									className="text-[10px] px-1.5 py-0 h-4 relative z-10"
								>
									{tag.name}
								</Badge>
							))}
						</div>
					)}
				</div>
				{!readOnly && !selectionMode && onEdit && onDelete && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-xs"
								className={cn(
									'shrink-0 relative z-10',
									isGrid
										? 'absolute top-1 right-1 opacity-0 group-hover:opacity-100'
										: 'sm:opacity-0 sm:group-hover:opacity-100',
								)}
							>
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onEdit}>
								<Pencil className="mr-2 size-4" />
								{t('edit')}
							</DropdownMenuItem>
							{onRemoveFromFolder && (
								<DropdownMenuItem onClick={onRemoveFromFolder}>
									<ArrowUpFromLine className="mr-2 size-4" />
									{t('removeFromFolder')}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onClick={onDelete} className="text-destructive">
								<Trash2 className="mr-2 size-4" />
								{t('delete')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</CardContent>
		</Card>
	)

	if (readOnly || isTouch || (!onEdit && !onDelete)) return content

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
			<ContextMenuContent>
				{onEdit && (
					<ContextMenuItem onClick={onEdit}>
						<Pencil className="mr-2 size-4" />
						{t('edit')}
					</ContextMenuItem>
				)}
				{onRemoveFromFolder && (
					<ContextMenuItem onClick={onRemoveFromFolder}>
						<ArrowUpFromLine className="mr-2 size-4" />
						{t('removeFromFolder')}
					</ContextMenuItem>
				)}
				{onDelete && (
					<ContextMenuItem onClick={onDelete} className="text-destructive">
						<Trash2 className="mr-2 size-4" />
						{t('delete')}
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	)
}
