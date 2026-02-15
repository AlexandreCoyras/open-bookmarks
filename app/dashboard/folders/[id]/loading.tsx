import { FolderPlus, Globe, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function FolderLoading() {
	return (
		<div className="space-y-4 sm:space-y-6">
			<Skeleton className="h-5 w-48" />

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-7 w-40" />
				<div className="flex gap-2">
					<Button size="sm" variant="outline" disabled>
						<FolderPlus className="size-4" />
						<span className="hidden sm:inline">Sous-dossier</span>
					</Button>
					<Button size="sm" disabled>
						<Plus className="size-4" />
						<span className="hidden sm:inline">Ajouter un favori</span>
					</Button>
					<Button size="icon-sm" variant="ghost" disabled>
						<Globe className="size-4" />
					</Button>
					<Button size="icon-sm" variant="ghost" disabled>
						<Pencil className="size-4" />
					</Button>
					<Button size="icon-sm" variant="ghost" disabled>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
				{['a', 'b'].map((key) => (
					<Skeleton key={key} className="h-12 w-full rounded-lg" />
				))}
			</div>

			<Separator className="my-6" />

			<div className="grid gap-2">
				{['a', 'b', 'c'].map((key) => (
					<Skeleton key={key} className="h-16 w-full rounded-lg" />
				))}
			</div>
		</div>
	)
}
