'use client'

import { useDroppable } from '@dnd-kit/core'
import { ArrowUpFromLine } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DroppableRoot() {
	const { setNodeRef, isOver } = useDroppable({
		id: 'root-drop',
		data: { type: 'root' },
	})

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground transition-colors',
				isOver && 'border-primary bg-primary/5 text-primary',
			)}
		>
			<ArrowUpFromLine className="size-4" />
			Retirer du dossier
		</div>
	)
}
