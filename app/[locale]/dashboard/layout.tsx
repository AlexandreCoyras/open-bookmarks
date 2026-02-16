import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { AppHeader } from '@/components/app-header'
import { OfflineBanner } from '@/components/offline-banner'

export const metadata: Metadata = {
	robots: { index: false, follow: false },
}

export default async function AppLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)

	return (
		<div className="min-h-svh">
			<AppHeader />
			<OfflineBanner />
			<main className="px-3 py-4 sm:px-4">{children}</main>
			<footer className="py-4 text-center text-xs text-muted-foreground sm:fixed sm:bottom-2 sm:right-3 sm:py-0 sm:text-left">
				Made by{' '}
				<a
					href="https://github.com/AlexandreCoyras"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					AlexandreCoyras
				</a>
			</footer>
		</div>
	)
}
