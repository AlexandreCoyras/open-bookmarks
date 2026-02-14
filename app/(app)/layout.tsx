import { AppHeader } from '@/components/app-header'
import { OfflineBanner } from '@/components/offline-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
