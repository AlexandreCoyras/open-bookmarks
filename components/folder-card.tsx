'use client'

import { Folder, Globe, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
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

export type FolderData = {
	id: string
	name: string
	color: string | null
	parentId: string | null
	position: number
	publicSlug?: string | null
}

export function FolderCard({
	folder,
	onEdit,
	onDelete,
	readOnly,
	href,
}: {
	folder: FolderData
	onEdit?: () => void
	onDelete?: () => void
	readOnly?: boolean
	href?: string
}) {
	const content = (
		<Card className="group relative">
			<CardContent className="flex items-center gap-3 p-3">
				<Folder
					className="size-5 shrink-0"
					style={{ color: folder.color ?? undefined }}
				/>
				<Link
					href={href ?? `/folders/${folder.id}`}
					className="flex-1 font-medium text-sm hover:underline truncate after:absolute after:inset-0"
				>
					{folder.name}
				</Link>
				{folder.publicSlug && !readOnly && (
					<Globe className="size-3.5 shrink-0 text-muted-foreground" />
				)}
				{!readOnly && onEdit && onDelete && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-xs"
								className="opacity-0 group-hover:opacity-100 shrink-0 relative z-10"
							>
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onEdit}>
								<Pencil className="mr-2 size-4" />
								Modifier
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDelete} className="text-destructive">
								<Trash2 className="mr-2 size-4" />
								Supprimer
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</CardContent>
		</Card>
	)

	if (readOnly) return content

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={onEdit}>
					<Pencil className="mr-2 size-4" />
					Modifier
				</ContextMenuItem>
				<ContextMenuItem onClick={onDelete} className="text-destructive">
					<Trash2 className="mr-2 size-4" />
					Supprimer
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
