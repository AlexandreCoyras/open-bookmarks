import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

const bookmarks = [
	{ title: 'Guide Tailwind CSS', url: 'tailwindcss.com/docs' },
	{ title: 'Documentation React', url: 'react.dev/reference' },
]

export function DemoSection() {
	const t = useTranslations('Landing')

	const folders = [
		{ color: 'bg-amber-400', label: t('demoDesign') },
		{ color: 'bg-blue-400', label: t('demoDevelopment') },
		{ color: 'bg-green-400', label: t('demoResources') },
	]

	return (
		<section className="overflow-hidden py-24">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<div className="text-center">
					<h2 className="font-serif text-3xl font-bold sm:text-4xl">
						{t('demoTitle')}
					</h2>
					<p className="mt-4 text-muted-foreground">{t('demoDescription')}</p>
				</div>

				<div className="relative mt-16">
					<div className="absolute -inset-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />

					<div className="relative overflow-hidden rounded-xl border bg-card shadow-2xl">
						<div className="flex h-10 items-center gap-2 border-b bg-muted/50 px-4">
							<div className="flex gap-1.5">
								<div className="size-3 rounded-full bg-red-400" />
								<div className="size-3 rounded-full bg-yellow-400" />
								<div className="size-3 rounded-full bg-green-400" />
							</div>
							<div className="mx-4 flex h-6 flex-1 items-center rounded-md bg-background px-3 text-xs text-muted-foreground">
								openbookmarks.app/dashboard
							</div>
						</div>

						<div className="min-h-[300px] p-4 sm:p-6">
							<h3 className="text-lg font-semibold">{t('demoMyBookmarks')}</h3>

							<div className="mt-4 space-y-2">
								{folders.map((folder) => (
									<div
										key={folder.label}
										className="flex items-center gap-3 rounded-lg border bg-background p-3"
									>
										<div className={`size-4 rounded-full ${folder.color}`} />
										<span className="flex-1 text-sm font-medium">
											{folder.label}
										</span>
										<ChevronRight className="size-4 text-muted-foreground" />
									</div>
								))}
							</div>

							<div className="my-4 h-px bg-border" />

							<div className="space-y-2">
								{bookmarks.map((bookmark) => (
									<div
										key={bookmark.title}
										className="flex items-center gap-3 rounded-lg border bg-background p-3"
									>
										<div className="size-4 rounded bg-muted" />
										<div className="flex-1">
											<span className="text-sm font-medium">
												{bookmark.title}
											</span>
											<span className="ml-2 text-xs text-muted-foreground">
												{bookmark.url}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
