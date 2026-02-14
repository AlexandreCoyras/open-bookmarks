import { AppHeader } from '@/components/app-header'
import { OfflineBanner } from '@/components/offline-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-svh">
			<AppHeader />
			<OfflineBanner />
			<main className="p-4">{children}</main>
			<footer className="fixed bottom-2 right-3 text-xs text-muted-foreground">
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
