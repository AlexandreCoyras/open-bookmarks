'use client'

import { type FormEvent, useEffect, useState } from 'react'
import type { FolderData } from '@/components/folder-card'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FOLDER_COLORS = [
	'#ef4444',
	'#f97316',
	'#eab308',
	'#22c55e',
	'#3b82f6',
	'#8b5cf6',
	'#ec4899',
]

type FolderFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: { name: string; color?: string; parentId?: string }) => void
	defaultValues?: Partial<FolderData>
	loading?: boolean
}

export function FolderForm({
	open,
	onOpenChange,
	onSubmit,
	defaultValues,
	loading,
}: FolderFormProps) {
	const [name, setName] = useState('')
	const [color, setColor] = useState<string | null>(null)

	useEffect(() => {
		if (open) {
			setName(defaultValues?.name ?? '')
			setColor(defaultValues?.color ?? null)
		}
	}, [open, defaultValues])

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		onSubmit({
			name,
			color: color ?? undefined,
			parentId: defaultValues?.parentId ?? undefined,
		})
	}

	const isEditing = !!defaultValues?.id

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing ? 'Modifier le dossier' : 'Nouveau dossier'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="folder-name">Nom</Label>
						<Input
							id="folder-name"
							placeholder="Mon dossier"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label>Couleur</Label>
						<div className="flex gap-2">
							{FOLDER_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									className="size-7 rounded-full border-2 transition-transform hover:scale-110"
									style={{
										backgroundColor: c,
										borderColor: color === c ? 'white' : 'transparent',
										boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
									}}
									onClick={() => setColor(color === c ? null : c)}
								/>
							))}
						</div>
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
							{loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Creer'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
