'use client'

import { useQuery } from '@tanstack/react-query'
import { Folder, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/eden'

type FolderItem = {
	id: string
	name: string
	parentId: string | null
	color: string | null
	icon: string | null
}

function useAllFolders() {
	return useQuery({
		queryKey: ['folders', 'all'],
		queryFn: async () => {
			const { data, error } = await api.api.folders.get({
				query: { all: 'true' },
			})
			if (error) throw error
			return data as FolderItem[]
		},
	})
}

type TreeNode = FolderItem & { children: TreeNode[] }

function buildTree(folders: FolderItem[]): TreeNode[] {
	const map = new Map<string, TreeNode>()
	for (const f of folders) {
		map.set(f.id, { ...f, children: [] })
	}

	const roots: TreeNode[] = []
	for (const f of folders) {
		const node = map.get(f.id)!
		if (f.parentId && map.has(f.parentId)) {
			map.get(f.parentId)!.children.push(node)
		} else {
			roots.push(node)
		}
	}

	return roots
}

function FolderTreeItem({
	node,
	depth,
	currentFolderId,
	onSelect,
	currentLabel,
}: {
	node: TreeNode
	depth: number
	currentFolderId?: string | null
	onSelect: (id: string | null) => void
	currentLabel: string
}) {
	const isCurrent = node.id === currentFolderId

	return (
		<>
			<button
				type="button"
				disabled={isCurrent}
				onClick={() => onSelect(node.id)}
				className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				<Folder
					className="size-4 shrink-0"
					style={{ color: node.color ?? undefined }}
				/>
				<span className="truncate">{node.name}</span>
				{isCurrent && (
					<span className="ml-auto text-xs text-muted-foreground">
						{currentLabel}
					</span>
				)}
			</button>
			{node.children.map((child) => (
				<FolderTreeItem
					key={child.id}
					node={child}
					depth={depth + 1}
					currentFolderId={currentFolderId}
					onSelect={onSelect}
					currentLabel={currentLabel}
				/>
			))}
		</>
	)
}

export function FolderPickerDialog({
	open,
	onOpenChange,
	onSelect,
	currentFolderId,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSelect: (folderId: string | null) => void
	currentFolderId?: string | null
}) {
	const { data: folders } = useAllFolders()
	const tree = folders ? buildTree(folders) : []
	const t = useTranslations('FolderPicker')

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
				</DialogHeader>
				<div className="max-h-64 overflow-y-auto space-y-0.5">
					<button
						type="button"
						onClick={() => onSelect(null)}
						className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
					>
						<Home className="size-4 shrink-0" />
						<span>{t('root')}</span>
					</button>
					{tree.map((node) => (
						<FolderTreeItem
							key={node.id}
							node={node}
							depth={1}
							currentFolderId={currentFolderId}
							onSelect={onSelect}
							currentLabel={t('current')}
						/>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
