import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { BookmarkSceneWrapper } from './bookmark-scene-wrapper'
import { ScrollToFeaturesButton } from './scroll-to-features-button'

export function HeroSection() {
	const t = useTranslations('Landing')
	const indicators = [t('openSource'), t('multiDevice'), t('collaboration')]

	return (
		<section className="flex min-h-svh items-center pt-24">
			<div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
				<div>
					<h1 className="animate-fade-in-up font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
						{t('heroTitle')}
					</h1>

					<p className="animate-fade-in-up mt-6 text-lg text-muted-foreground [animation-delay:100ms]">
						{t('heroDescription')}
					</p>

					<div className="animate-fade-in-up mt-8 flex flex-wrap gap-4 [animation-delay:200ms]">
						<Button asChild size="lg">
							<Link href="/register">{t('getStarted')}</Link>
						</Button>
						<ScrollToFeaturesButton label={t('learnMore')} />
					</div>

					<div className="animate-fade-in-up mt-12 flex flex-wrap gap-6 [animation-delay:300ms]">
						{indicators.map((label) => (
							<span
								key={label}
								className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium"
							>
								{label}
							</span>
						))}
					</div>
				</div>

				<div className="animate-fade-in-up hidden min-h-[500px] lg:block [animation-delay:400ms]">
					<BookmarkSceneWrapper />
				</div>
			</div>
		</section>
	)
}
