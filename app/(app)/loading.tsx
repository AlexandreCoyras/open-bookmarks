import { FolderPlus, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-semibold text-xl">Mes favoris</h2>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" disabled>
						<Upload className="mr-1 size-4" />
						Importer
					</Button>
					<Button size="sm" variant="outline" disabled>
						<FolderPlus className="mr-1 size-4" />
						Nouveau dossier
					</Button>
					<Button size="sm" disabled>
						<Plus className="mr-1 size-4" />
						Ajouter un favori
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
				{['a', 'b', 'c', 'd'].map((key) => (
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
