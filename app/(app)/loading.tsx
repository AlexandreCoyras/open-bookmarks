import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-7 w-32" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-36" />
					<Skeleton className="h-8 w-40" />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
				{['a', 'b', 'c', 'd'].map((key) => (
					<Skeleton key={key} className="h-12 w-full rounded-lg" />
				))}
			</div>

			<Skeleton className="h-px w-full" />

			<div className="grid gap-2">
				{['a', 'b', 'c'].map((key) => (
					<Skeleton key={key} className="h-16 w-full rounded-lg" />
				))}
			</div>
		</div>
	)
}
