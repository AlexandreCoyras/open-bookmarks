'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ALL_ICON_MAP, ICON_CATEGORIES, getFolderIcon } from '@/lib/folder-icons'
import { cn } from '@/lib/utils'

type IconPickerProps = {
	value: string | null
	onChange: (icon: string | null) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
	const [search, setSearch] = useState('')
	const query = search.toLowerCase().trim()

	const filteredCategories = query
		? [
				{
					label: 'Resultats',
					icons: Object.keys(ALL_ICON_MAP)
						.filter((name) => {
							const searchName = name.startsWith('phosphor:')
								? name.slice(9)
								: name
							return searchName.includes(query)
						})
						.slice(0, 48),
				},
			]
		: ICON_CATEGORIES

	return (
		<div className="grid gap-2">
			<Label>Icone</Label>
			<div className="relative">
				<Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Rechercher une icone..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>
			<div className="max-h-64 overflow-y-auto rounded-md border p-2">
				{value && (
					<button
						type="button"
						className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1 text-muted-foreground text-xs hover:bg-muted"
						onClick={() => onChange(null)}
					>
						<X className="size-3.5" />
						Retirer l'icone
					</button>
				)}
				{filteredCategories.map((category) => {
					if (category.icons.length === 0) return null
					return (
						<div key={category.label} className="mb-2 last:mb-0">
							<p className="mb-1 px-1 font-medium text-muted-foreground text-xs">
								{category.label}
							</p>
							<div className="grid grid-cols-8 gap-1">
								{category.icons.map((name) => {
									const Icon = getFolderIcon(name)
									const displayName = name.startsWith('phosphor:')
										? name.slice(9)
										: name
									return (
										<button
											key={name}
											type="button"
											title={displayName}
											className={cn(
												'flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-muted',
												value === name &&
													'bg-primary/10 ring-2 ring-primary',
											)}
											onClick={() =>
												onChange(value === name ? null : name)
											}
										>
											<Icon className="size-4" />
										</button>
									)
								})}
							</div>
						</div>
					)
				})}
				{query && filteredCategories.every((c) => c.icons.length === 0) && (
					<p className="py-3 text-center text-muted-foreground text-xs">
						Aucune icone trouvee
					</p>
				)}
			</div>
		</div>
	)
}
