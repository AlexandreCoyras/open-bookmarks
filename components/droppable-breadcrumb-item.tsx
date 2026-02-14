'use client'

import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function DroppableBreadcrumbItem({
	folderId,
	children,
}: {
	folderId: string | null
	children: ReactNode
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `breadcrumb-${folderId ?? 'home'}`,
		data: { type: 'folder', folderId },
	})

	return (
		<span
			ref={setNodeRef}
			className={cn(
				'rounded px-1 -mx-1 transition-colors',
				isOver && 'ring-2 ring-primary bg-primary/10',
			)}
		>
			{children}
		</span>
	)
}
